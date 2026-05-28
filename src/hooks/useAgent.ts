import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAgentStore } from "../stores/agentStore";
import { useProjectStore } from "../stores/projectStore";

export function useAgent() {
  let unlisten: (() => void) | null = null;
  let currentMessageId: string | null = null;

  async function startListening() {
    if (unlisten) return;

    unlisten = await listen<string>("agent:message", (event) => {
      try {
        const msg = JSON.parse(event.payload);
        handleMessage(msg);
      } catch {
        // ignore parse errors
      }
    });
  }

  function handleMessage(msg: Record<string, unknown>) {
    const { appendStream, finishStream, addMessage, addToolCall, updateToolCallById } =
      useAgentStore.getState();

    switch (msg.type) {
      case "system":
        break;

      case "stream":
        if (msg.content) {
          appendStream(msg.content as string);
        }
        break;

      case "assistant_text":
        if (msg.content) {
          appendStream(msg.content as string);
        }
        break;

      case "tool_use": {
        addToolCall({
          id: crypto.randomUUID(),
          messageId: currentMessageId ?? undefined,
          name: (msg.name as string) || "unknown",
          input: (msg.input as Record<string, unknown>) || {},
          status: "running",
          timestamp: Date.now(),
        });
        break;
      }

      case "tool_result":
        if (msg.toolUseId) {
          updateToolCallById(
            msg.toolUseId as string,
            (msg.content as string) || "",
            "completed",
          );
        }
        break;

      case "warning":
        if (msg.content) {
          appendStream(`\n⚠️ ${msg.content}\n`);
        }
        break;

      case "done":
        finishStream();
        currentMessageId = null;
        break;

      case "error":
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          content: `❌ Error: ${msg.content}`,
          timestamp: Date.now(),
        });
        finishStream();
        currentMessageId = null;
        break;
    }
  }

  async function ensureAgentStarted(projectPath: string): Promise<void> {
    const running = await invoke<boolean>("is_agent_running").catch(() => false);
    if (running) return;

    await invoke("start_agent", { projectPath });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  async function sendMessage(content: string) {
    const { projectRoot } = useProjectStore.getState();
    if (!projectRoot) return;

    const { addMessage, clearStream, setStreaming } = useAgentStore.getState();

    // Track the message ID for tool call association
    const msgId = crypto.randomUUID();
    currentMessageId = msgId;

    addMessage({
      id: msgId,
      role: "user",
      content,
      timestamp: Date.now(),
    });

    await startListening();

    clearStream();
    setStreaming(true);

    try {
      await ensureAgentStarted(projectRoot);
      await invoke("send_agent_message", { content });
    } catch (e) {
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Failed: ${e}`,
        timestamp: Date.now(),
      });
      setStreaming(false);
      currentMessageId = null;
    }
  }

  async function stopAgent() {
    const { finishStream } = useAgentStore.getState();
    try {
      await invoke("stop_agent");
    } catch {
      // ignore
    }
    if (unlisten) {
      unlisten();
      unlisten = null;
    }
    finishStream();
    currentMessageId = null;
  }

  return { sendMessage, stopAgent, startListening };
}
