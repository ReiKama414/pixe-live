import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeEngine } from "./RealtimeEngine";
import { MockRealtimeAdapter } from "./MockRealtimeAdapter";
import { NetworkSimulator } from "./NetworkSimulator";
import { StreamQualityManager } from "../stream/StreamQualityManager";

describe("PIXELIVE transport and recovery", () => {
  let engine: RealtimeEngine;
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    engine = new RealtimeEngine();
    const start = engine.start();
    await vi.advanceTimersByTimeAsync(100);
    await start;
  });
  afterEach(() => {
    engine.dispose();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  it("optimistically renders, then acknowledges exactly one message", async () => {
    engine.send("hello universe");
    expect(engine.getSnapshot().messages.at(-1)?.status).toBe("pending");
    await vi.advanceTimersByTimeAsync(100);
    const own = engine.getSnapshot().messages.filter((m) => m.own);
    expect(own).toHaveLength(1);
    expect(own[0].status).toBe("sent");
  });
  it("keeps high-latency messages pending until their ACK arrives", async () => {
    engine.setMode("HIGH LATENCY");
    engine.send("slow hello");
    await vi.advanceTimersByTimeAsync(499);
    expect(engine.getSnapshot().messages.find((m) => m.own)?.status).toBe(
      "pending",
    );
    await vi.advanceTimersByTimeAsync(600);
    expect(engine.getSnapshot().messages.find((m) => m.own)?.status).toBe(
      "sent",
    );
  });
  it("retries offline with exponential backoff, recovers events, and flushes in order", async () => {
    const states: string[] = [];
    engine.subscribe(() => states.push(engine.getSnapshot().state));
    const last = engine.getSnapshot().lastSeq;
    engine.setMode("DISCONNECT");
    engine.send("offline one");
    engine.send("offline two");
    await vi.advanceTimersByTimeAsync(7000);
    expect(engine.getSnapshot().lastSeq).toBe(last);
    expect(engine.getSnapshot().attempt).toBe(2);
    expect(
      engine.getSnapshot().messages.filter((m) => m.status === "queued"),
    ).toHaveLength(2);
    engine.setMode("NORMAL");
    await vi.advanceTimersByTimeAsync(1500);
    expect(states).toContain("SYNCING");
    expect(engine.getSnapshot().state).toBe("CONNECTED");
    expect(engine.getSnapshot().recovered).toBeGreaterThan(0);
    const own = engine.getSnapshot().messages.filter((m) => m.own);
    expect(own.map((m) => m.text)).toEqual(["offline one", "offline two"]);
    expect(own.every((m) => m.status === "sent")).toBe(true);
    expect(engine.getSnapshot().notice).toContain("CONNECTION RESTORED");
  });
  it("queues an in-flight message when disconnected before its ACK", async () => {
    engine.setMode("HIGH LATENCY");
    engine.send("in flight");
    engine.setMode("DISCONNECT");
    await vi.advanceTimersByTimeAsync(1800);
    expect(engine.getSnapshot().messages.find((m) => m.own)?.status).toBe(
      "queued",
    );
    engine.setMode("NORMAL");
    await vi.advanceTimersByTimeAsync(1500);
    expect(engine.getSnapshot().messages.filter((m) => m.own)).toHaveLength(1);
    expect(engine.getSnapshot().messages.find((m) => m.own)?.status).toBe(
      "sent",
    );
  });
  it("allows failed packet delivery to be retried without duplicate rendering", async () => {
    engine.setMode("UNSTABLE");
    vi.mocked(Math.random).mockReturnValue(0.1);
    engine.send("retry this");
    await vi.advanceTimersByTimeAsync(600);
    const message = engine.getSnapshot().messages.find((m) => m.own)!;
    expect(message.status).toBe("failed");
    engine.setMode("NORMAL");
    engine.retry(message.id);
    await vi.advanceTimersByTimeAsync(100);
    expect(engine.getSnapshot().messages.filter((m) => m.own)).toHaveLength(1);
    expect(engine.getSnapshot().messages.find((m) => m.own)?.status).toBe(
      "sent",
    );
  });
  it("bounds outgoing queue and chat history", async () => {
    engine.setMode("DISCONNECT");
    for (let i = 0; i < 75; i++) engine.send(`queued ${i}`);
    expect(engine.getSnapshot().messages.filter((m) => m.own)).toHaveLength(50);
    engine.setMode("NORMAL");
    await vi.advanceTimersByTimeAsync(200000);
    expect(engine.getSnapshot().messages.length).toBeLessThanOrEqual(100);
  });
  it("cleans up every simulation timer on disposal", async () => {
    engine.setMode("DISCONNECT");
    engine.react();
    engine.notify("test");
    engine.dispose();
    await vi.advanceTimersByTimeAsync(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("deduplicates transport sends by message ID and bounds server history", async () => {
    const network = new NetworkSimulator();
    const adapter = new MockRealtimeAdapter(network);
    const connecting = adapter.connect();
    await vi.advanceTimersByTimeAsync(100);
    await connecting;
    const message = {
      id: "stable-id",
      author: "you",
      text: "only once",
      color: "#fff",
      status: "pending" as const,
    };
    const first = adapter.send(message);
    await vi.advanceTimersByTimeAsync(100);
    const a = await first;
    const second = adapter.send(message);
    await vi.advanceTimersByTimeAsync(100);
    const b = await second;
    expect(a.seq).toBe(b.seq);
    expect(
      adapter.recover(0).filter((e) => e.messageId === message.id),
    ).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1200000);
    expect(adapter.recover(0)).toHaveLength(600);
    adapter.dispose();
  });
  it("restores quality one step per stable period", () => {
    const quality = new StreamQualityManager();
    expect(quality.update("DISCONNECT")).toBe("360p");
    expect(quality.update("NORMAL")).toBe("360p");
    expect(quality.update("NORMAL")).toBe("360p");
    expect(quality.update("NORMAL")).toBe("480p");
    quality.update("NORMAL");
    quality.update("NORMAL");
    expect(quality.update("NORMAL")).toBe("720p");
    quality.update("NORMAL");
    quality.update("NORMAL");
    expect(quality.update("NORMAL")).toBe("1080p");
  });
});
