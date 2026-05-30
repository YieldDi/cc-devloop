import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ToolCallInfo {
  id: string;
  messageId?: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: "running" | "completed" | "error";
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: AgentMessage[];
  toolCalls: ToolCallInfo[];
  createdAt: number;
  updatedAt: number;
}

interface AgentStore {
  chats: Chat[];
  activeChatId: string | null;
  isStreaming: boolean;
  currentStream: string;

  // Computed-like helpers
  activeChat: () => Chat | undefined;
  activeMessages: () => AgentMessage[];
  activeToolCalls: () => ToolCallInfo[];

  // Chat management
  createChat: () => string;
  switchChat: (id: string) => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;

  // Message operations
  addMessage: (msg: AgentMessage) => void;
  appendStream: (token: string) => void;
  finishStream: () => void;
  setStreaming: (v: boolean) => void;
  addToolCall: (tc: ToolCallInfo) => void;
  updateToolCallById: (id: string, output: string, status: ToolCallInfo["status"]) => void;
  clearStream: () => void;
  getToolCallsForMessage: (messageId: string) => ToolCallInfo[];
  reset: () => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      isStreaming: false,
      currentStream: "",

      activeChat: () => {
        const { chats, activeChatId } = get();
        return chats.find((c) => c.id === activeChatId);
      },

      activeMessages: () => {
        const chat = get().activeChat();
        return chat?.messages ?? [];
      },

      activeToolCalls: () => {
        const chat = get().activeChat();
        return chat?.toolCalls ?? [];
      },

      createChat: () => {
        const id = crypto.randomUUID();
        const chat: Chat = {
          id,
          title: "New Chat",
          messages: [],
          toolCalls: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          chats: [chat, ...s.chats],
          activeChatId: id,
          currentStream: "",
          isStreaming: false,
        }));
        return id;
      },

      switchChat: (id) => {
        set({ activeChatId: id, currentStream: "", isStreaming: false });
      },

      deleteChat: (id) => {
        set((s) => {
          const remaining = s.chats.filter((c) => c.id !== id);
          const newActive = s.activeChatId === id
            ? (remaining.length > 0 ? remaining[0].id : null)
            : s.activeChatId;
          return { chats: remaining, activeChatId: newActive, currentStream: "", isStreaming: false };
        });
      },

      renameChat: (id, title) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        }));
      },

      addMessage: (msg) =>
        set((s) => {
          const chatId = s.activeChatId;
          if (!chatId) return s;
          return {
            chats: s.chats.map((c) => {
              if (c.id !== chatId) return c;
              // Auto-title from first user message
              const title = c.messages.length === 0 && msg.role === "user"
                ? msg.content.slice(0, 40) + (msg.content.length > 40 ? "..." : "")
                : c.title;
              return {
                ...c,
                title,
                messages: [...c.messages, msg],
                updatedAt: Date.now(),
              };
            }),
          };
        }),

      appendStream: (token) =>
        set((s) => ({ currentStream: s.currentStream + token })),

      finishStream: () =>
        set((s) => {
          const streamContent = s.currentStream.trim();
          if (!streamContent || !s.activeChatId) {
            return { currentStream: "", isStreaming: false };
          }
          const assistantMsg: AgentMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: streamContent,
            timestamp: Date.now(),
          };
          return {
            chats: s.chats.map((c) =>
              c.id === s.activeChatId
                ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() }
                : c
            ),
            currentStream: "",
            isStreaming: false,
          };
        }),

      setStreaming: (v) => set({ isStreaming: v }),

      addToolCall: (tc) =>
        set((s) => {
          const chatId = s.activeChatId;
          if (!chatId) return s;
          return {
            chats: s.chats.map((c) =>
              c.id === chatId
                ? { ...c, toolCalls: [...c.toolCalls, tc], updatedAt: Date.now() }
                : c
            ),
          };
        }),

      updateToolCallById: (id, output, status) =>
        set((s) => {
          const chatId = s.activeChatId;
          if (!chatId) return s;
          return {
            chats: s.chats.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    toolCalls: c.toolCalls.map((tc) =>
                      tc.id === id ? { ...tc, output, status } : tc
                    ),
                    updatedAt: Date.now(),
                  }
                : c
            ),
          };
        }),

      clearStream: () => set({ currentStream: "" }),

      getToolCallsForMessage: (messageId) => {
        const chat = get().activeChat();
        return chat?.toolCalls.filter((tc) => tc.messageId === messageId) ?? [];
      },

      reset: () =>
        set({ isStreaming: false, currentStream: "" }),
    }),
    {
      name: "cc-devloop-agent",
      version: 1,
      migrate: (persisted, version) => {
        // v0 was flat messages/toolCalls — discard and start fresh
        if (version === 0) {
          return { chats: [], activeChatId: null };
        }
        return persisted as { chats: Chat[]; activeChatId: string | null };
      },
      partialize: (state) => ({
        chats: state.chats.map((c) => ({
          ...c,
          // Don't persist running tool calls
          toolCalls: c.toolCalls.filter((tc) => tc.status !== "running"),
        })),
        activeChatId: state.activeChatId,
      }),
    },
  ),
);
