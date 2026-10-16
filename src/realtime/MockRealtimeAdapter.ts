import { NetworkSimulator } from "./NetworkSimulator";
import type { ChatMessage, RealtimeTransport, ServerEvent } from "./types";
const lines = [
  "the vibes are immaculate ✨",
  "YUKI LET’S GOOO!!",
  "this is my happy place ♡",
  "音楽が最高！",
  "mint squad checking in 🌿",
  "one more game? 👀",
  "that was actually insane",
  "sending all the good energy",
  "the setup is so cozy",
  "こんにちは from Tokyo!",
  "chat we are so back",
  "never missing a stream 💚",
];
const names = [
  "mochi.exe",
  "starrynight",
  "neko_nova",
  "ramenboy",
  "mintymochi",
  "pixel_ghost",
  "luna.zip",
  "sakura.wav",
];
export class MockRealtimeAdapter implements RealtimeTransport {
  private seq = 1040;
  private history: ServerEvent[] = [];
  private listeners = new Set<(event: ServerEvent) => void>();
  private online = false;
  private timer: ReturnType<typeof setInterval>;
  private waits = new Map<ReturnType<typeof setTimeout>, () => void>();
  private ack = new Map<string, ServerEvent>();
  constructor(public network: NetworkSimulator) {
    this.timer = setInterval(() => {
      const n = Math.random();
      const event = this.record({
        type:
          n < 0.7 ? "CHAT" : n < 0.89 ? "LIKE" : n < 0.97 ? "GIFT" : "FOLLOW",
        author: names[Math.floor(Math.random() * names.length)],
        text: lines[Math.floor(Math.random() * lines.length)],
        amount: 1 + Math.floor(Math.random() * 12),
      });
      if (
        this.online &&
        !network.offline &&
        !(network.mode === "UNSTABLE" && Math.random() < 0.3)
      )
        this.listeners.forEach((fn) => fn(event));
    }, 1800);
  }
  private delay(ms: number) {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waits.delete(timer);
        resolve();
      }, ms);
      this.waits.set(timer, () => reject(new Error("Disposed")));
    });
  }
  private record(event: Omit<ServerEvent, "seq">) {
    const full = { ...event, seq: ++this.seq };
    this.history.push(full);
    if (this.history.length > 600) this.history.shift();
    return full;
  }
  async connect() {
    await this.delay(this.network.sample());
    if (this.network.offline) throw new Error("Offline");
    this.online = true;
  }
  disconnect() {
    this.online = false;
  }
  async send(message: ChatMessage) {
    await this.delay(this.network.sample());
    if (!this.online || this.network.offline) throw new Error("Offline");
    if (this.network.mode === "UNSTABLE" && Math.random() < 0.25)
      throw new Error("Packet lost");
    if (this.ack.has(message.id)) return this.ack.get(message.id)!;
    const event = this.record({
      type: "CHAT",
      author: message.author,
      text: message.text,
      amount: 1,
      messageId: message.id,
    });
    this.ack.set(message.id, event);
    if (this.ack.size > 300) this.ack.delete(this.ack.keys().next().value!);
    this.listeners.forEach((fn) => fn(event));
    return event;
  }
  recover(after: number) {
    return this.history.filter((event) => event.seq > after);
  }
  subscribe(listener: (event: ServerEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  dispose() {
    clearInterval(this.timer);
    this.waits.forEach((reject, timer) => {
      clearTimeout(timer);
      reject();
    });
    this.waits.clear();
    this.listeners.clear();
  }
}
