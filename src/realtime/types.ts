export type ConnectionState =
  | "IDLE"
  | "CONNECTING"
  | "CONNECTED"
  | "UNSTABLE"
  | "RECONNECTING"
  | "SYNCING"
  | "OFFLINE";
export type NetworkMode = "NORMAL" | "HIGH LATENCY" | "UNSTABLE" | "DISCONNECT";
export type MessageStatus = "pending" | "sent" | "failed" | "queued";
export type ChatMessage = {
  id: string;
  author: string;
  text: string;
  status: MessageStatus;
  own?: boolean;
  color: string;
};
export type ServerEvent = {
  seq: number;
  type: "CHAT" | "LIKE" | "GIFT" | "FOLLOW";
  author: string;
  text: string;
  amount: number;
  messageId?: string;
};
export interface RealtimeTransport {
  connect(): Promise<void>;
  disconnect(): void;
  send(message: ChatMessage): Promise<ServerEvent>;
  recover(after: number): ServerEvent[];
  subscribe(listener: (event: ServerEvent) => void): () => void;
  dispose(): void;
}
