import type {
  ChatMessage,
  ConnectionState,
  NetworkMode,
  RealtimeTransport,
  ServerEvent,
} from "./types";
import { NetworkSimulator } from "./NetworkSimulator";
import { MockRealtimeAdapter } from "./MockRealtimeAdapter";
import { StreamQualityManager } from "../stream/StreamQualityManager";
export type Snapshot = {
  state: ConnectionState;
  mode: NetworkMode;
  latency: number;
  messages: ChatMessage[];
  lastSeq: number;
  recovered: number;
  attempt: number;
  quality: string;
  likes: number;
  viewers: number;
  combo: number;
  xp: number;
  notice: string;
  effect: string;
  recovery: { chat: number; gifts: number; reactions: number };
};
const transitions: Record<ConnectionState, ConnectionState[]> = {
  IDLE: ["CONNECTING"],
  CONNECTING: ["CONNECTED", "OFFLINE"],
  CONNECTED: ["UNSTABLE", "OFFLINE"],
  UNSTABLE: ["CONNECTED", "OFFLINE"],
  OFFLINE: ["RECONNECTING"],
  RECONNECTING: ["RECONNECTING", "SYNCING", "OFFLINE"],
  SYNCING: ["CONNECTED", "UNSTABLE", "OFFLINE"],
};
export class RealtimeEngine {
  network = new NetworkSimulator();
  private transport: RealtimeTransport;
  private quality = new StreamQualityManager();
  private listeners = new Set<() => void>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private interval: ReturnType<typeof setInterval> | undefined;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private queue: ChatMessage[] = [];
  private flushing = false;
  private disposed = false;
  private generation = 0;
  private snapshot: Snapshot = {
    state: "IDLE",
    mode: "NORMAL",
    latency: 48,
    messages: [
      {
        id: "welcome1",
        author: "mintymochi",
        text: "first stream here and already in love 💚",
        color: "#bca5fc",
        status: "sent",
      },
      {
        id: "welcome2",
        author: "neko_nova",
        text: "welcome to the mint squad!!",
        color: "#99e5c2",
        status: "sent",
      },
      {
        id: "welcome3",
        author: "sakura.wav",
        text: "the cozy vibes are unmatched ✨",
        color: "#f3a6be",
        status: "sent",
      },
    ],
    lastSeq: 1040,
    recovered: 0,
    attempt: 0,
    quality: "1080p",
    likes: 24800,
    viewers: 1248,
    combo: 0,
    xp: 240,
    notice: "",
    effect: "",
    recovery: { chat: 0, gifts: 0, reactions: 0 },
  };
  constructor(factory?: (network: NetworkSimulator) => RealtimeTransport) {
    this.transport = factory
      ? factory(this.network)
      : new MockRealtimeAdapter(this.network);
    this.transport.subscribe(this.receive);
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = () => this.snapshot;
  private set(value: Partial<Snapshot>) {
    if (this.disposed) return;
    this.snapshot = { ...this.snapshot, ...value };
    this.listeners.forEach((fn) => fn());
  }
  private transition(state: ConnectionState) {
    if (!transitions[this.snapshot.state].includes(state)) return false;
    this.set({ state });
    return true;
  }
  private later(fn: () => void, delay: number) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.disposed) fn();
    }, delay);
    this.timers.add(timer);
    return timer;
  }
  async start() {
    if (this.snapshot.state !== "IDLE") return;
    this.transition("CONNECTING");
    try {
      await this.transport.connect();
      if (this.getSnapshot().state === "CONNECTING") {
        this.transition("CONNECTED");
        void this.flush();
      }
    } catch {
      if (!this.disposed) this.disconnect();
    }
    if (this.disposed) return;
    this.interval = setInterval(() => {
      const previous = this.snapshot.quality;
      const quality = this.quality.update(this.network.mode);
      this.set({
        latency: this.network.offline ? 0 : this.network.sample(),
        quality,
      });
      if (previous !== quality)
        this.notify(`Auto quality adjusted to ${quality}`);
    }, 2000);
  }
  private receive = (event: ServerEvent) => {
    if (
      ["OFFLINE", "RECONNECTING", "SYNCING"].includes(this.snapshot.state) ||
      event.seq <= this.snapshot.lastSeq
    )
      return;
    this.accept(event);
  };
  private accept(event: ServerEvent) {
    // Fill sequence gaps before accepting live events, including simulated packet loss.
    if (event.seq > this.snapshot.lastSeq + 1)
      this.transport
        .recover(this.snapshot.lastSeq)
        .filter((e) => e.seq < event.seq)
        .forEach(this.process);
    this.process(event);
  }
  private process = (event: ServerEvent) => {
    if (event.seq <= this.snapshot.lastSeq) return;
    this.set({ lastSeq: event.seq });
    if (event.type === "CHAT") {
      if (
        event.messageId &&
        this.snapshot.messages.some((m) => m.id === event.messageId)
      )
        this.status(event.messageId, "sent");
      else
        this.set({
          messages: [
            ...this.snapshot.messages,
            {
              id: `event-${event.seq}`,
              author: event.author,
              text: event.text,
              status: "sent" as const,
              color: ["#99e5c2", "#bca5fc", "#f3a6be"][event.seq % 3],
            },
          ].slice(-100),
        });
    } else if (event.type === "LIKE")
      this.set({ likes: this.snapshot.likes + event.amount });
    else if (event.type === "GIFT") {
      this.set({ combo: this.snapshot.combo + 1 });
      this.effect("✨");
    } else {
      this.set({ viewers: this.snapshot.viewers + 1 });
      this.notify(`${event.author} joined the universe. Welcome, new friend!`);
    }
  };
  private status(id: string, status: ChatMessage["status"]) {
    this.set({
      messages: this.snapshot.messages.map((m) =>
        m.id === id ? { ...m, status } : m,
      ),
    });
  }
  send(text: string) {
    if (!text.trim()) return;
    if (this.queue.length >= 50) {
      this.notify(
        "Your queue is full (50 messages). Reconnect to send your waiting messages.",
      );
      return;
    }
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      author: "you",
      text: text.trim().slice(0, 280),
      status: ["CONNECTED", "UNSTABLE"].includes(this.snapshot.state)
        ? "pending"
        : "queued",
      own: true,
      color: "#99e5c2",
    };
    this.set({ messages: [...this.snapshot.messages, message].slice(-100) });
    this.queue.push(message);
    void this.flush();
  }
  retry(id: string) {
    const message = this.snapshot.messages.find((m) => m.id === id);
    if (message && !this.queue.some((m) => m.id === id)) {
      this.queue.push(message);
      this.status(id, "queued");
      void this.flush();
    }
  }
  private async flush() {
    if (
      this.flushing ||
      !["CONNECTED", "UNSTABLE", "SYNCING"].includes(this.snapshot.state)
    )
      return;
    this.flushing = true;
    try {
      while (this.queue.length && !this.network.offline && !this.disposed) {
        const message = this.queue[0];
        this.status(message.id, "pending");
        try {
          const event = await this.transport.send(message);
          this.accept(event);
          this.status(message.id, "sent");
          this.queue.shift();
        } catch {
          if (this.disposed) break;
          if (this.network.offline) {
            this.status(message.id, "queued");
            break;
          }
          this.status(message.id, "failed");
          this.queue.shift();
        }
      }
    } finally {
      this.flushing = false;
    }
  }
  setMode(mode: NetworkMode) {
    this.network.mode = mode;
    this.set({ mode });
    if (mode === "DISCONNECT") this.disconnect();
    else if (["OFFLINE", "RECONNECTING"].includes(this.snapshot.state))
      void this.reconnect();
    else if (mode === "UNSTABLE") {
      this.transition("UNSTABLE");
      this.notify("Signal is wobbly. We’re keeping you connected.");
    } else if (this.snapshot.state === "UNSTABLE") this.transition("CONNECTED");
  }
  private disconnect() {
    this.generation++;
    this.transport.disconnect();
    this.transition("OFFLINE");
    this.set({
      attempt: 0,
      recovered: 0,
      messages: this.snapshot.messages.map((m) =>
        m.status === "pending" ? { ...m, status: "queued" } : m,
      ),
    });
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.timers.delete(this.retryTimer);
    }
    this.scheduleRetry();
  }
  private scheduleRetry() {
    this.retryTimer = this.later(
      () => {
        void this.reconnect();
      },
      Math.min(8000, 1000 * 2 ** this.snapshot.attempt),
    );
  }
  private async reconnect() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.timers.delete(this.retryTimer);
    }
    if (!this.transition("RECONNECTING")) return;
    const generation = ++this.generation;
    this.set({ attempt: this.snapshot.attempt + 1 });
    try {
      await this.transport.connect();
      if (generation !== this.generation || this.disposed) return;
      this.transition("SYNCING");
      this.later(() => {
        if (generation !== this.generation) return;
        const events = this.transport.recover(this.snapshot.lastSeq);
        const recovery = {
          chat: events.filter((e) => e.type === "CHAT").length,
          gifts: events.filter((e) => e.type === "GIFT").length,
          reactions: events
            .filter((e) => e.type === "LIKE")
            .reduce((n, e) => n + e.amount, 0),
        };
        events.forEach(this.process);
        this.set({ recovered: events.length, recovery });
        void this.flush().then(() => {
          if (generation !== this.generation || this.disposed) return;
          this.transition(
            this.network.mode === "UNSTABLE" ? "UNSTABLE" : "CONNECTED",
          );
          this.notify(
            `CONNECTION RESTORED! +${recovery.chat} chat recovered · +${recovery.gifts} gifts synced · +${recovery.reactions} reactions`,
          );
        });
      }, 1100);
    } catch {
      if (generation === this.generation && !this.disposed)
        this.scheduleRetry();
    }
  }
  notify(notice: string) {
    this.set({ notice });
    this.later(() => {
      if (this.snapshot.notice === notice) this.set({ notice: "" });
    }, 6500);
  }
  effect(effect: string) {
    this.set({ effect });
    this.later(() => this.set({ effect: "" }), 2200);
  }
  react() {
    this.set({ likes: this.snapshot.likes + 1, xp: this.snapshot.xp + 5 });
    this.effect("💚");
  }
  gift(emoji: string) {
    const previous = this.snapshot.xp;
    const xp = previous + 100;
    this.set({ combo: this.snapshot.combo + 1, xp });
    this.effect(emoji);
    this.notify(
      Math.floor(xp / 500) > Math.floor(previous / 500)
        ? "ACHIEVEMENT UNLOCKED · Super fan! +100 XP"
        : "Gift delivered! +100 XP · affinity increased ♡",
    );
  }
  dispose() {
    this.disposed = true;
    this.generation++;
    this.transport.dispose();
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    clearInterval(this.interval);
    this.listeners.clear();
  }
}
