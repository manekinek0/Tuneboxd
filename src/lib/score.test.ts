import { describe, expect, it } from "vitest";
import { computeScore, rawScore, vibeMultiplier } from "./score";

const all = (n: number) => ({ rhymes: n, structure: n, style: n, individuality: n, vibe: n });

describe("score", () => {
  it("maps vibe onto x1.0000..x1.6072", () => {
    expect(vibeMultiplier(1)).toBe(1);
    expect(vibeMultiplier(10)).toBeCloseTo(1.6072, 10);
  });

  it("gives 90 for all tens and 6 for all ones", () => {
    expect(rawScore(all(10))).toBeCloseTo(90, 1);
    expect(computeScore(all(10))).toBe(90);
    expect(computeScore(all(1))).toBe(6);
  });

  it("computes a mixed example", () => {
    // (8+7+9+6) * 1.4 = 42; 42 * (1 + 6 * 0.6072 / 9) = 59.0016
    expect(computeScore({ rhymes: 8, structure: 7, style: 9, individuality: 6, vibe: 7 })).toBe(59);
  });
});
