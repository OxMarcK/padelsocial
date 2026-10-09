import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isPastDate, isUpcomingPublicEvent } from "./upcoming";
import type { PadelEvent } from "./types";

describe("isPastDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats a session dated today as not-past while it's still today in Amsterdam", () => {
    // 2026-09-20T22:00:00Z is already 2026-09-21T00:00:00+02:00 in Amsterdam —
    // the club's calendar day has already rolled over even though a
    // UTC-local comparison would still call it "the 20th".
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T21:00:00Z"));
    expect(isPastDate("2026-09-20")).toBe(false);
  });

  it("is past once Amsterdam has actually rolled over to the next day", () => {
    // The exact regression this guards: a UTC server clock reads
    // 2026-09-20T22:27Z (still "the 20th" if you naively use local/UTC
    // time), but it's already 2026-09-21T00:27+02:00 in Amsterdam.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T22:27:00Z"));
    expect(isPastDate("2026-09-20")).toBe(true);
  });

  it("is never past for a date later than today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T12:00:00Z"));
    expect(isPastDate("2026-09-21")).toBe(false);
  });
});

describe("isUpcomingPublicEvent", () => {
  const event = (patch: Partial<PadelEvent>) => ({ status: "draft", hidden: false, ...patch }) as PadelEvent;

  it("shows a concept event that isn't hidden", () => {
    expect(isUpcomingPublicEvent(event({}))).toBe(true);
  });

  it("leaves a hidden event off the agenda, whatever its phase", () => {
    expect(isUpcomingPublicEvent(event({ hidden: true }))).toBe(false);
    expect(isUpcomingPublicEvent(event({ hidden: true, status: "poulefase" }))).toBe(false);
  });

  it("never lists a finished event as upcoming", () => {
    expect(isUpcomingPublicEvent(event({ status: "finished" }))).toBe(false);
  });
});
