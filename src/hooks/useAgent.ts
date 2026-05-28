import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAgentStore } from "../stores/agentStore";
import { useProjectStore } from "../stores/projectStore";

export function useAgent() {
  const {
    addMessage,
    appendStream,
    finishStream,
    setStreaming,
    addToolCall,
    updateToolCallById,
    clearStream,
  } = useAgentStore.getState();

  let unlisten: (() => void) | null = null;

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
    switch (msg.type) {
      case "system":
        // Agent started
        break;

      case "stream":
        // Streaming text token
        if (msg.content) {
          appendStream(msg.content as string);
        }
        break;

      case "assistant_text":
        // Complete text block from assistant
        if (msg.content) {
          appendStream(msg.content as string);
        }
        break;

      case "tool_use": {
        const toolId = crypto.randomUUID();
        addToolCall({
          id: toolId,
          name: (msg.name as string) || "unknown",
          input: (msg.input as Record<string, unknown>) || {},
          status: "running",
        });
        // Also show in stream
        const toolName = msg.name as string;
        const toolInput = msg.input as Record<string, unknown>;
        let toolHint = `🔧 ${toolName}`;
        if (toolInput.path) toolHint += ` → ${toolInput.path}`;
        else if (toolInput.command) toolHint += ` → ${toolInput.command}`;
        else if (toolInput.pattern) toolHint += ` → ${toolInput.pattern}`;
        appendStream(`\n${toolHint}\n`);
        break;
      }

      case "tool_result":
        // Tool completed
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
        break;

      case "error":
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          content: `❌ Error: ${msg.content}`,
          timestamp: Date.now(),
        });
        finishStream();
        break;
    }
  }

  async function ensureAgentStarted(projectPath: string): Promise<void> {
    const running = await invoke<boolean>("is_agent_running").catch(() => false);
    if (running) return;

    await invoke("start_agent", { projectPath });
    // Wait briefly for the Node.js process to initialize
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  async function sendMessage(content: string) {
    const { projectRoot } = useProjectStore.getState();
    if (!projectRoot) return;

    // Add user message to chat
    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    });

    // Start listening for events
    await startListening();

    // Reset stream
    clearStream();
    setStreaming(true);

    try {
      // Ensure agent is started (only starts if not already running)
      await ensureAgentStarted(projectRoot);

      // Send the actual message
      await invoke("send_agent_message", { content });
    } catch (e) {
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Failed: ${e}`,
        timestamp: Date.now(),
      });
      setStreaming(false);
    }
  }

  async function stopAgent() {
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
  }

  return { sendMessage, stopAgent, startListening };
}
