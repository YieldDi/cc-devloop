// Agent runner - wraps Claude Agent SDK query() with project-scoped config
// For Phase 1 MVP, we use a simple approach: spawn Claude Code CLI as subprocess

import { readMessages, writeMessage } from "./bridge";

const projectPath = process.argv[2] || process.cwd();

readMessages(async (msg) => {
  if (msg.type === "user_message") {
    await handleUserMessage(msg.content);
  }
});

async function handleUserMessage(content: string): Promise<void> {
  writeMessage({ type: "stream", content: "" });
  writeMessage({
    type: "stream",
    content: `[Agent received] Project: ${projectPath}\nPrompt: ${content}\n\n` +
      "Agent SDK integration pending. Installing @anthropic-ai/claude-agent-sdk will enable full agent capabilities.\n" +
      "For now, this is a placeholder response confirming the IPC bridge is working.",
  });
  writeMessage({ type: "done" });
}
