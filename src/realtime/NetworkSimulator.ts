import type { NetworkMode } from "./types";
export class NetworkSimulator {
  mode: NetworkMode = "NORMAL";
  latency = 48;
  sample() {
    this.latency =
      this.mode === "NORMAL"
        ? 20 + Math.floor(Math.random() * 61)
        : this.mode === "HIGH LATENCY"
          ? 500 + Math.floor(Math.random() * 1001)
          : 300 + Math.floor(Math.random() * 1800);
    return this.latency;
  }
  get offline() {
    return this.mode === "DISCONNECT";
  }
}
