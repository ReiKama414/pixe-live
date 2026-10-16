export type Quality = "1080p" | "720p" | "480p" | "360p";
export class StreamQualityManager {
  quality: Quality = "1080p";
  private stableTicks = 0;
  update(mode: string) {
    const levels: Quality[] = ["360p", "480p", "720p", "1080p"];
    if (mode !== "NORMAL") {
      this.stableTicks = 0;
      this.quality =
        mode === "HIGH LATENCY"
          ? "720p"
          : mode === "DISCONNECT"
            ? "360p"
            : "480p";
    } else if (++this.stableTicks >= 3) {
      this.quality = levels[Math.min(3, levels.indexOf(this.quality) + 1)];
      this.stableTicks = 0;
    }
    return this.quality;
  }
}
