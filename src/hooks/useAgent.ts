import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAgentStore } from "../stores/agentStore";
import { useProjectStore } from "../stores/projectStore";

export function useAgent() {
  const { addMessage, appendStream, finishStream, setStreaming, addToolCall } =
    useAgentStore.getState();
  const { projectRoot } = useProjectStore.getState();

  let unlisten: (() => void) | null = null;

  async function startListening() {
    if (unlisten) return;

    unlisten = await listen<string>("agent:message", (event) => {
      try {
        const msg = JSON.parse(event.payload);

        switch (msg.type) {
          case "stream":
            if (msg.content) {
              appendStream(msg.content as string);
            }
            break;

          case "tool_use":
            addToolCall({
              name: msg.name as string,
              input: (msg.input as Record<string, unknown>) || {},
              status: "running",
            });
            break;

          case "tool_result":
            useAgentStore
              .getState()
              .updateToolCall(
                msg.name as string,
                msg.output as string,
                "completed",
              );
            break;

          case "done":
            finishStream();
            break;

          case "error":
            addMessage({
              id: crypto.randomUUID(),
              role: "system",
              content: `Error: ${msg.content}`,
              timestamp: Date.now(),
            });
            setStreaming(false);
            break;
        }
      } catch {
        // ignore parse errors
      }
    });
  }

  async function sendMessage(content: string) {
    if (!projectRoot) return;

    // Add user message
    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    });

    // Start listening if not already
    await startListening();

    // Start agent if not running
    try {
      setStreaming(true);
      await invoke("start_agent", { projectPath: projectRoot });
      await invoke("send_agent_message", { content });
    } catch (e) {
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Failed to start agent: ${e}`,
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
    setStreaming(false);
  }

  return { sendMessage, stopAgent, startListening };
}
