import { describe, expect, it } from "vitest";
import { fmtCountdown } from "./schedule";

describe("fmtCountdown", () => {
  it("shows m:ss under an hour", () => {
    expect(fmtCountdown(0)).toBe("0:00");
    expect(fmtCountdown(-5000)).toBe("0:00");
    expect(fmtCountdown((19 * 60 + 7) * 1000)).toBe("19:07");
  });

  it("shows h:mm:ss under a day", () => {
    expect(fmtCountdown((2 * 3600 + 5 * 60 + 9) * 1000)).toBe("2:05:09");
  });

  it("shows days and hours beyond a day", () => {
    expect(fmtCountdown((4 * 86_400 + 24) * 1000)).toBe("4d 0u");
    expect(fmtCountdown((1 * 86_400 + 3 * 3600 + 59 * 60) * 1000)).toBe("1d 3u");
  });
});
