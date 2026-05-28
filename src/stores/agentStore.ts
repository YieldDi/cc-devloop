import { create } from "zustand";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
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
  updateToolCall: (name: string, output: string, status: ToolCallInfo["status"]) => void;
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
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: s.currentStream,
          timestamp: Date.now(),
        },
      ],
      currentStream: "",
      isStreaming: false,
    })),

  setStreaming: (v) => set({ isStreaming: v }),

  addToolCall: (tc) => set((s) => ({ toolCalls: [...s.toolCalls, tc] })),

  updateToolCall: (name, output, status) =>
    set((s) => ({
      toolCalls: s.toolCalls.map((tc) =>
        tc.name === name ? { ...tc, output, status } : tc,
      ),
    })),

  reset: () => set({ messages: [], isStreaming: false, currentStream: "", toolCalls: [] }),
}));
