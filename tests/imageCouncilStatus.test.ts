import { describe, expect, it } from "vitest";
import {
  mapImageCouncilStatus,
  type ImageCouncilStage,
  type ImageCouncilStatus,
} from "../services/imageCouncilState";

describe("mapImageCouncilStatus", () => {
  const cases: Array<[ImageCouncilStatus, ImageCouncilStage]> = [
    ["queued", "briefing"],
    ["moderating", "briefing"],
    ["generating", "making"],
    ["evaluating", "reviewing"],
    ["debating", "reviewing"],
    ["refining", "refining"],
    ["ranking", "selection"],
    ["polishing", "selection"],
    ["completed", "selection"],
    ["partial", "selection"],
    ["cancel_requested", "selection"],
    ["cancelled", "selection"],
    ["failed", "selection"],
    ["quarantined", "selection"],
  ];

  it.each(cases)("maps %s to %s", (status, expectedStage) => {
    expect(mapImageCouncilStatus(status)).toBe(expectedStage);
  });
});
