import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAgentStore } from "../stores/agentStore";
import { useProjectStore } from "../stores/projectStore";
import { useEditorStore } from "../stores/editorStore";

/** Tool names that modify files */
const FILE_WRITE_TOOLS = new Set(["Write", "Edit"]);

/** Extract file path from tool input */
function getToolPath(name: string, input: Record<string, unknown>): string | null {
  if (input.path) return input.path as string;
  if (input.file_path) return input.file_path as string;
  if (name === "Bash" && input.command) {
    // Best-effort: not all bash commands touch files
    return null;
  }
  return null;
}

export function useAgent() {
  let unlisten: (() => void) | null = null;
  let currentMessageId: string | null = null;

  // Track pending file changes from tool_use → tool_result
  const pendingFileChanges = new Map<string, string>(); // toolUseId → filePath

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
        const toolName = (msg.name as string) || "unknown";
        const toolInput = (msg.input as Record<string, unknown>) || {};

        // Generate a stable ID we can track
        const toolId = crypto.randomUUID();

        addToolCall({
          id: toolId,
          messageId: currentMessageId ?? undefined,
          name: toolName,
          input: toolInput,
          status: "running",
          timestamp: Date.now(),
        });

        // Track file-changing tools for auto-refresh
        if (FILE_WRITE_TOOLS.has(toolName)) {
          const filePath = getToolPath(toolName, toolInput);
          if (filePath) {
            pendingFileChanges.set(toolId, filePath);
          }
        }
        break;
      }

      case "tool_result": {
        const toolUseId = msg.toolUseId as string;
        updateToolCallById(
          toolUseId,
          (msg.content as string) || "",
          "completed",
        );

        // If this was a file-changing tool, trigger refresh and create diff
        const changedFile = pendingFileChanges.get(toolUseId);
        if (changedFile) {
          pendingFileChanges.delete(toolUseId);

          // Create a pending diff if the file is currently open
          const { openFiles, addPendingDiff } = useEditorStore.getState();
          const openFile = openFiles.get(changedFile);
          if (openFile) {
            // Read the new content from disk (agent already wrote it)
            invoke<string>("read_file", { path: changedFile }).then((newContent) => {
              addPendingDiff({
                id: crypto.randomUUID(),
                path: changedFile,
                original: openFile.content,
                modified: newContent,
                language: openFile.language,
              });
            }).catch(() => {
              // If read fails, just do a normal refresh
              handleFileChange(changedFile);
            });
          } else {
            // File not open — just refresh the tree
            handleFileChange(changedFile);
          }
        }
        break;
      }

      case "warning":
        if (msg.content) {
          appendStream(`\n⚠️ ${msg.content}\n`);
        }
        break;

      case "done":
        finishStream();
        currentMessageId = null;
        // Flush any remaining pending changes
        for (const [, filePath] of pendingFileChanges) {
          handleFileChange(filePath);
        }
        pendingFileChanges.clear();
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
        pendingFileChanges.clear();
        break;
    }
  }

  /** Handle a file change detected from agent tool use */
  function handleFileChange(filePath: string) {
    // 1. Refresh the file in the editor if it's open
    const { refreshFile } = useEditorStore.getState();
    refreshFile(filePath);

    // 2. Refresh the parent directory in the file tree
    const { projectRoot, refreshDir } = useProjectStore.getState();
    if (projectRoot) {
      const parentDir = filePath.substring(0, filePath.lastIndexOf("/"));
      if (parentDir && parentDir.startsWith(projectRoot)) {
        refreshDir(parentDir);
      }
    }
  }

  async function ensureAgentStarted(projectPath: string): Promise<void> {
    const running = await invoke<boolean>("is_agent_running").catch(() => false);
    if (running) {
      console.log("[Agent] Already running");
      return;
    }

    // Agent not running — make sure streaming state is clean
    const { setStreaming } = useAgentStore.getState();
    setStreaming(false);

    console.log("[Agent] Starting agent at", projectPath);
    try {
      const result = await invoke<string>("start_agent", { projectPath });
      console.log("[Agent] Start result:", result);
    } catch (e) {
      console.error("[Agent] Start failed:", e);
      throw e;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  async function sendMessage(content: string) {
    const { projectRoot } = useProjectStore.getState();
    if (!projectRoot) {
      const { addMessage } = useAgentStore.getState();
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: "Please open a project first (click 'Open Project' in the sidebar)",
        timestamp: Date.now(),
      });
      return;
    }

    const { addMessage, clearStream, setStreaming } = useAgentStore.getState();

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
      const errMsg = `Failed: ${e}`;
      console.error("[Agent]", errMsg);
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: errMsg,
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
    pendingFileChanges.clear();
  }

  return { sendMessage, stopAgent, startListening };
}
