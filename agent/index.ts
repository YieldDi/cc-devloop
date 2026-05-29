import { query } from "@anthropic-ai/claude-agent-sdk";
import { readMessages, writeMessage } from "./bridge.ts";

const projectPath = process.argv[2] || process.cwd();

const model = process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || "claude-sonnet-4-6";

// Conversation history for context management
// We track messages and replay them as the prompt
interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
}
const conversationHistory: ConversationEntry[] = [];

const systemPrompt = `You are a senior software engineer working in the project at ${projectPath}.
You can read, write, and edit files, search code, and run commands.
When creating files, follow the project's existing patterns and conventions.
Always explain what you're doing before making changes.`;

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

  // Build prompt with conversation context
  let prompt: string;
  if (conversationHistory.length === 0) {
    prompt = content;
  } else {
    // Include conversation history in the prompt for context
    const historyStr = conversationHistory
      .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`)
      .join("\n\n");
    prompt = `Previous conversation:\n${historyStr}\n\nUser: ${content}`;
  }

  let assistantText = "";

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd: projectPath,
        model,
        allowedTools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
        permissionMode: "acceptEdits",
        includePartialMessages: true,
        maxTurns: 30,
        systemPrompt,
      },
    })) {
      forwardMessage(message);

      // Capture assistant text for history
      const m = message as Record<string, unknown>;
      if (m.type === "assistant") {
        const msg = m.message as Record<string, unknown>;
        if (msg) {
          const contentBlocks = msg.content as Array<Record<string, unknown>>;
          if (contentBlocks) {
            for (const block of contentBlocks) {
              if (block.type === "text" && block.text) {
                assistantText += block.text;
              }
            }
          }
        }
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    writeMessage({ type: "error", content: errorMsg });
  }

  // Save to conversation history (keep last 10 turns = 20 messages)
  conversationHistory.push({ role: "user", content });
  if (assistantText) {
    conversationHistory.push({ role: "assistant", content: assistantText });
  }
  // Trim to prevent context from growing too large
  while (conversationHistory.length > 20) {
    conversationHistory.shift();
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
          id: block.id as string,
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
