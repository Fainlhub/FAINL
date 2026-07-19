import { describe, expect, it } from "vitest";
import {
  createBlindOrder,
  deterministicShuffle,
  validateRanking,
} from "../services/imageCouncilState";

const candidateIds = ["branch-a", "branch-b", "branch-c", "branch-d", "branch-e"];

describe("blind deterministic ordering", () => {
  it("produces the same permutation for the same session seed", () => {
    const first = deterministicShuffle(candidateIds, "session-42:round-1");
    const second = deterministicShuffle(candidateIds, "session-42:round-1");

    expect(first).toEqual(second);
    expect(first).toHaveLength(candidateIds.length);
    expect(new Set(first)).toEqual(new Set(candidateIds));
    expect(candidateIds).toEqual([
      "branch-a",
      "branch-b",
      "branch-c",
      "branch-d",
      "branch-e",
    ]);
  });

  it("assigns anonymous labels after shuffling", () => {
    const order = createBlindOrder(candidateIds, "session-42:reviewer-2");

    expect(order.map(({ blindId }) => blindId)).toEqual([
      "candidate-01",
      "candidate-02",
      "candidate-03",
      "candidate-04",
      "candidate-05",
    ]);
    expect(new Set(order.map(({ candidateId }) => candidateId))).toEqual(
      new Set(candidateIds),
    );
  });

  it("rejects duplicate candidate ids before creating a blind order", () => {
    expect(() => createBlindOrder(["branch-a", "branch-a"], "seed")).toThrow(
      "Candidate ids must be non-empty and unique",
    );
  });
});

describe("ranking validation", () => {
  it("accepts an exact permutation of all candidates", () => {
    expect(
      validateRanking(candidateIds, [
        "branch-e",
        "branch-c",
        "branch-a",
        "branch-d",
        "branch-b",
      ]),
    ).toBe(true);
  });

  it.each([
    ["missing candidate", ["branch-a", "branch-b", "branch-c", "branch-d"]],
    [
      "duplicate candidate",
      ["branch-a", "branch-a", "branch-c", "branch-d", "branch-e"],
    ],
    [
      "unknown candidate",
      ["branch-a", "branch-b", "branch-c", "branch-d", "branch-x"],
    ],
  ])("rejects a ranking with a %s", (_label, ranking) => {
    expect(validateRanking(candidateIds, ranking)).toBe(false);
  });
});
