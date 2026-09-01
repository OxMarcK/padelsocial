import { describe, expect, it } from "vitest";
import {
  activeReservations,
  findActiveReservationForMember,
  isReservationExpired,
  isSessionFull,
  sessionCapacity,
} from "./sessions";
import type { Reservation } from "./session-types";

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "res_1",
    sessionId: "session_1",
    memberId: "member_1",
    status: "held",
    reservedAt: "2026-09-01T10:00:00.000Z",
    holdExpiresAt: "2026-09-01T11:00:00.000Z",
    paidAt: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("sessionCapacity", () => {
  it("is courts times 4", () => {
    expect(sessionCapacity({ courts: 4 })).toBe(16);
    expect(sessionCapacity({ courts: 3 })).toBe(12);
  });
});

describe("isReservationExpired", () => {
  it("is expired once the hold window has passed", () => {
    const r = reservation({ holdExpiresAt: "2026-09-01T11:00:00.000Z" });
    expect(isReservationExpired(r, new Date("2026-09-01T10:59:00.000Z"))).toBe(false);
    expect(isReservationExpired(r, new Date("2026-09-01T11:00:01.000Z"))).toBe(true);
  });

  it("never expires a paid reservation, however old its hold window", () => {
    const r = reservation({ status: "paid", holdExpiresAt: "2020-01-01T00:00:00.000Z" });
    expect(isReservationExpired(r, new Date())).toBe(false);
  });
});

describe("activeReservations", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");

  it("excludes cancelled and expired-by-status reservations", () => {
    const rows = [reservation({ id: "a", status: "cancelled" }), reservation({ id: "b", status: "expired" })];
    expect(activeReservations(rows, now)).toEqual([]);
  });

  it("excludes a held reservation whose hold window has quietly passed, even if still stored as held", () => {
    const rows = [reservation({ id: "a", status: "held", holdExpiresAt: "2026-09-01T11:00:00.000Z" })];
    expect(activeReservations(rows, now)).toEqual([]);
  });

  it("keeps paid and still-within-window held reservations", () => {
    const rows = [
      reservation({ id: "a", status: "paid", holdExpiresAt: "2020-01-01T00:00:00.000Z" }),
      reservation({ id: "b", status: "held", holdExpiresAt: "2026-09-01T13:00:00.000Z" }),
    ];
    expect(activeReservations(rows, now).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("isSessionFull", () => {
  it("is full once active reservations reach courts * 4", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    const rows = Array.from({ length: 8 }, (_, i) =>
      reservation({ id: `r${i}`, memberId: `m${i}`, holdExpiresAt: "2026-09-01T13:00:00.000Z" })
    );
    expect(isSessionFull({ courts: 2 }, rows, now)).toBe(true);
    expect(isSessionFull({ courts: 3 }, rows, now)).toBe(false);
  });
});

describe("findActiveReservationForMember", () => {
  it("finds the member's active reservation, ignoring an expired one for someone else", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    const rows = [
      reservation({ id: "a", memberId: "other", status: "expired" }),
      reservation({ id: "b", memberId: "me", status: "paid" }),
    ];
    expect(findActiveReservationForMember(rows, "me", now)?.id).toBe("b");
  });

  it("returns null when the member has no active reservation", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    expect(findActiveReservationForMember([], "me", now)).toBeNull();
  });
});
