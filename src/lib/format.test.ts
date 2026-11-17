import { describe, expect, it } from "vitest";
import { formatDate, toDate } from "./format";

describe("toDate", () => {
  it("parses Postgres text timestamps with short offsets", () => {
    expect(toDate("2026-11-17 11:46:51.338+00").toISOString()).toBe("2026-11-17T11:46:51.338Z");
    expect(toDate("2026-11-17 11:46:51+0530").toISOString()).toBe("2026-11-17T06:16:51.000Z");
  });

  it("keeps plain dates and ISO strings", () => {
    expect(toDate("2024-05-01").toISOString()).toBe("2024-05-01T00:00:00.000Z");
    expect(toDate("2026-11-17T11:46:51.338Z").toISOString()).toBe("2026-11-17T11:46:51.338Z");
  });
});

describe("formatDate", () => {
  it("returns an empty string for missing or invalid values", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("not a date")).toBe("");
  });
});
