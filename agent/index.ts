import { query } from "@anthropic-ai/claude-agent-sdk";
import { readMessages, writeMessage } from "./bridge.ts";
import { randomUUID } from "crypto";

const projectPath = process.argv[2] || process.cwd();

// Resolve model from env or use default
const model = process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || "claude-sonnet-4-6";

// Use a session ID for the lifetime of this agent process
let sessionId = randomUUID();
let isFirstQuery = true;
let turnCount = 0;
const MAX_TURNS_WITHOUT_RESET = 20;

const systemPrompt = `You are a senior software engineer working in the project at ${projectPath}.
You can read, write, and edit files, search code, and run commands.
When creating files, follow the project's existing patterns and conventions.
Always explain what you're doing before making changes.`;

// Signal that the agent process is ready
writeMessage({ type: "ready" });

readMessages(async (msg) => {
  if (msg.type === "user_message") {
    await handleUserMessage(msg.content);
  }
});

async function handleUserMessage(content: string): Promise<void> {
  writeMessage({
    type: "system",
    subtype: "start",
    projectPath,
  });

  turnCount++;

  try {
    // On first call: just set sessionId so the SDK creates a named session
    // On subsequent calls: resume the session for context continuity
    const queryOptions: Record<string, unknown> = {
      cwd: projectPath,
      model,
      allowedTools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
      permissionMode: "acceptEdits",
      includePartialMessages: true,
      maxTurns: 30,
      systemPrompt,
    };

    if (isFirstQuery) {
      // First message: create the session with our fixed ID
      queryOptions.sessionId = sessionId;
      isFirstQuery = false;
    } else if (turnCount <= MAX_TURNS_WITHOUT_RESET) {
      // Subsequent messages: resume the existing session
      queryOptions.resume = sessionId;
    } else {
      // Too many turns: start a fresh session
      sessionId = randomUUID();
      queryOptions.sessionId = sessionId;
      turnCount = 0;
      writeMessage({
        type: "warning",
        content: "Session context refreshed to maintain performance",
      });
    }

    for await (const message of query({
      prompt: content,
      options: queryOptions,
    })) {
      forwardMessage(message);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    writeMessage({ type: "error", content: errorMsg });
  }

  writeMessage({ type: "done" });
}

function forwardMessage(msg: unknown): void {
  const m = msg as Record<string, unknown>;

  if (m.type === "stream_event") {
    const event = m.event as Record<string, unknown>;
    if (!event) return;

    if (event.type === "content_block_delta") {
      const delta = event.delta as Record<string, unknown>;
      if (delta?.type === "text_delta" && delta.text) {
        writeMessage({ type: "stream", content: delta.text as string });
      }
    }
  } else if (m.type === "assistant") {
    const message = m.message as Record<string, unknown>;
    if (!message) return;

    const content = message.content as Array<Record<string, unknown>>;
    if (!content) return;

    for (const block of content) {
      if (block.type === "tool_use") {
        writeMessage({
          type: "tool_use",
          name: block.name as string,
          input: block.input as Record<string, unknown>,
        });
      } else if (block.type === "text") {
        const text = block.text as string;
        if (text) {
          writeMessage({ type: "assistant_text", content: text });
        }
      }
    }
  } else if (m.type === "user") {
    const message = m.message as Record<string, unknown>;
    if (!message) return;

    const content = message.content as Array<Record<string, unknown>>;
    if (!content) return;

    for (const block of content) {
      if (block.type === "tool_result") {
        writeMessage({
          type: "tool_result",
          toolUseId: block.tool_use_id as string,
          content: typeof block.content === "string"
            ? block.content
            : JSON.stringify(block.content),
        });
      }
    }
  } else if (m.type === "result") {
    const subtype = m.subtype as string;
    if (subtype === "error_max_turns" || subtype === "error_during_execution") {
      writeMessage({
        type: "warning",
        content: `Agent finished: ${subtype}`,
      });
    }
  }
}
