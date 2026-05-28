// stdin/stdout JSON message protocol between Tauri (Rust) and Agent (Node.js)
// All messages are newline-delimited JSON

export interface IncomingMessage {
  type: "user_message";
  content: string;
}

export interface OutgoingMessage {
  type: "stream" | "tool_use" | "tool_result" | "done" | "error";
  [key: string]: unknown;
}

export function writeMessage(msg: OutgoingMessage): void {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

export function readMessages(handler: (msg: IncomingMessage) => Promise<void>): void {
  let buffer = "";
  process.stdin.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.trim()) {
        try {
          const msg = JSON.parse(line) as IncomingMessage;
          handler(msg);
        } catch {
          // ignore malformed JSON
        }
      }
    }
  });
}
