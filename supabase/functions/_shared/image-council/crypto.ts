import { AppError } from "./errors.ts"

export async function sha256Hex(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value)
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer))
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function base64ToBytes(base64: string): Uint8Array {
  try {
    const clean = base64.replace(/\s/g, "")
    const binary = atob(clean)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  } catch {
    throw new AppError("invalid_provider_image", "Provider returned invalid image data", 502)
  }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let output = ""
  const chunkSize = 32_768
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    output += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(output)
}

const IMAGE_SIGNATURES = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
} as const

export function validateImageBytes(bytes: Uint8Array, mimeType: string): asserts mimeType is keyof typeof IMAGE_SIGNATURES {
  const maximumBytes = 10 * 1024 * 1024
  if (bytes.length < 32 || bytes.length > maximumBytes) {
    throw new AppError("invalid_provider_image", "Generated image has an invalid size", 502)
  }
  if (!(mimeType in IMAGE_SIGNATURES)) {
    throw new AppError("invalid_provider_image", "Generated image type is not allowed", 502)
  }
  const signature = IMAGE_SIGNATURES[mimeType as keyof typeof IMAGE_SIGNATURES]
  if (!signature.every((byte, index) => bytes[index] === byte)) {
    throw new AppError("invalid_provider_image", "Generated image signature does not match its type", 502)
  }
  if (mimeType === "image/webp") {
    const marker = String.fromCharCode(...bytes.subarray(8, 12))
    if (marker !== "WEBP") throw new AppError("invalid_provider_image", "Invalid WebP image", 502)
  }
}

export async function deterministicUuid(namespace: string): Promise<string> {
  const hex = await sha256Hex(namespace)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}
