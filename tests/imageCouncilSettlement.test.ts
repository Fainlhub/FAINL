import { describe, expect, it } from "vitest";
import {
  calculateSettlement,
  MAX_IMAGE_COUNCIL_CREDITS,
} from "../services/imageCouncilState";

describe("calculateSettlement", () => {
  it("charges all nine reserved credits for a fully successful run", () => {
    expect(
      calculateSettlement({
        reservedCredits: MAX_IMAGE_COUNCIL_CREDITS,
        successfulBranches: 5,
        councilBundleCompleted: true,
        successfulPolishes: 3,
      }),
    ).toEqual({
      reservedCredits: 9,
      chargedCredits: 9,
      refundedCredits: 0,
    });
  });

  it("refunds unsuccessful and unused work in a partial run", () => {
    expect(
      calculateSettlement({
        reservedCredits: 9,
        successfulBranches: 3,
        councilBundleCompleted: true,
        successfulPolishes: 1,
      }),
    ).toEqual({
      reservedCredits: 9,
      chargedCredits: 5,
      refundedCredits: 4,
    });
  });

  it("refunds the full reservation when no billable unit succeeded", () => {
    expect(
      calculateSettlement({
        reservedCredits: 9,
        successfulBranches: 0,
        councilBundleCompleted: false,
        successfulPolishes: 0,
      }),
    ).toEqual({
      reservedCredits: 9,
      chargedCredits: 0,
      refundedCredits: 9,
    });
  });

  it.each([
    {
      reservedCredits: 10,
      successfulBranches: 0,
      councilBundleCompleted: false,
      successfulPolishes: 0,
    },
    {
      reservedCredits: 9,
      successfulBranches: 6,
      councilBundleCompleted: false,
      successfulPolishes: 0,
    },
    {
      reservedCredits: 9,
      successfulBranches: 0,
      councilBundleCompleted: false,
      successfulPolishes: 1.5,
    },
  ])("rejects out-of-contract counts: %o", (input) => {
    expect(() => calculateSettlement(input)).toThrow(RangeError);
  });

  it("rejects charging more successful units than were reserved", () => {
    expect(() =>
      calculateSettlement({
        reservedCredits: 2,
        successfulBranches: 2,
        councilBundleCompleted: true,
        successfulPolishes: 0,
      }),
    ).toThrow("Charged credits cannot exceed reserved credits");
  });
});
