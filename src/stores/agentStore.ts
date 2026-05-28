import { create } from "zustand";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: "running" | "completed" | "error";
}

interface AgentStore {
  messages: AgentMessage[];
  isStreaming: boolean;
  currentStream: string;
  toolCalls: ToolCallInfo[];
  addMessage: (msg: AgentMessage) => void;
  appendStream: (token: string) => void;
  finishStream: () => void;
  setStreaming: (v: boolean) => void;
  addToolCall: (tc: ToolCallInfo) => void;
  updateToolCallById: (id: string, output: string, status: ToolCallInfo["status"]) => void;
  clearStream: () => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  messages: [],
  isStreaming: false,
  currentStream: "",
  toolCalls: [],

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  appendStream: (token) =>
    set((s) => ({ currentStream: s.currentStream + token })),

  finishStream: () =>
    set((s) => {
      const streamContent = s.currentStream.trim();
      const newMessages = streamContent
        ? [
            ...s.messages,
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: streamContent,
              timestamp: Date.now(),
            },
          ]
        : s.messages;
      return {
        messages: newMessages,
        currentStream: "",
        isStreaming: false,
      };
    }),

  setStreaming: (v) => set({ isStreaming: v }),

  addToolCall: (tc) =>
    set((s) => ({ toolCalls: [...s.toolCalls, tc] })),

  updateToolCallById: (id, output, status) =>
    set((s) => ({
      toolCalls: s.toolCalls.map((tc) =>
        tc.id === id ? { ...tc, output, status } : tc,
      ),
    })),

  clearStream: () => set({ currentStream: "" }),

  reset: () =>
    set({ messages: [], isStreaming: false, currentStream: "", toolCalls: [] }),
}));
