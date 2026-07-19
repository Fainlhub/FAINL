import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  parseProviderFixture,
  type ImageCouncilBranchModel,
  type ImageCouncilProviderKey,
  type ImageFixtureMimeType,
} from "../services/imageCouncilState";

function readFixture(name: string): unknown {
  const url = new URL(`./fixtures/providers/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

describe("provider fixture parsing", () => {
  it.each<[
    ImageCouncilProviderKey,
    string,
    ImageCouncilBranchModel,
    ImageFixtureMimeType,
  ]>([
    ["google", "google-gemini", "gemini-3.1-flash-image", "image/png"],
    ["openai", "openai-gpt-image", "gpt-image-2", "image/jpeg"],
    ["huggingface", "huggingface-qwen", "Qwen/Qwen-Image", "image/webp"],
    ["huggingface", "huggingface-z-image", "Tongyi-MAI/Z-Image-Turbo", "image/png"],
    [
      "huggingface",
      "huggingface-sdxl",
      "stabilityai/stable-diffusion-xl-base-1.0",
      "image/jpeg",
    ],
  ])("normalizes the %s %s branch", (provider, fixture, model, mimeType) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const parsed = parseProviderFixture(provider, readFixture(fixture));

    expect(parsed).toMatchObject({ provider, model, mimeType, fixture: true });
    expect(parsed.bytes).toEqual(Uint8Array.from([1, 2, 3]));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("preserves Google safety metadata", () => {
    const parsed = parseProviderFixture("google", readFixture("google-gemini"));
    expect(parsed.providerSafety).toEqual({
      safetyRatings: [{ category: "fixture", blocked: false }],
    });
  });

  it("rejects a model assigned to the wrong provider", () => {
    expect(() =>
      parseProviderFixture("huggingface", {
        model: "gemini-3.1-flash-image",
        image: { mimeType: "image/png", base64: "AQID" },
      }),
    ).toThrow("Unsupported huggingface model branch");
  });

  it("rejects malformed base64 and unsupported MIME types", () => {
    expect(() =>
      parseProviderFixture("openai", {
        model: "gpt-image-2",
        data: [{ b64_json: "not base64" }],
      }),
    ).toThrow("Fixture image data must be valid base64");

    expect(() =>
      parseProviderFixture("huggingface", {
        model: "Qwen/Qwen-Image",
        image: { mimeType: "image/gif", base64: "AQID" },
      }),
    ).toThrow("Unsupported fixture image MIME type");
  });
});
