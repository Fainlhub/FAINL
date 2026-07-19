import type { DatabaseClient } from "./auth.ts"
import { sha256Hex } from "./crypto.ts"
import { STORAGE_BUCKET } from "./env.ts"
import { AppError } from "./errors.ts"
import type { GeneratedImage, ImageMimeType } from "./types.ts"

function extension(mimeType: ImageMimeType): string {
  return mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png"
}

export async function uploadTemporaryImage(
  admin: DatabaseClient,
  userId: string,
  runId: string,
  stepId: string,
  image: GeneratedImage,
): Promise<{ path: string; sha256: string }> {
  const sha256 = await sha256Hex(image.bytes)
  const path = `${userId}/${runId}/pending/${stepId}-${crypto.randomUUID()}.${extension(image.mimeType)}`
  const { error } = await admin.storage.from(STORAGE_BUCKET).upload(path, image.bytes, {
    contentType: image.mimeType,
    cacheControl: "private, no-store",
    upsert: false,
  })
  if (error) throw new AppError("storage_upload_failed", "Private temporary upload failed", 503, true)
  return { path, sha256 }
}

export async function downloadPrivateImage(
  admin: DatabaseClient,
  path: string,
): Promise<{ bytes: Uint8Array; mimeType: ImageMimeType }> {
  const { data, error } = await admin.storage.from(STORAGE_BUCKET).download(path)
  if (error || !data) throw new AppError("storage_download_failed", "Private image could not be loaded", 503, true)
  const mimeType = data.type === "image/jpeg" || data.type === "image/webp" ? data.type : "image/png"
  return { bytes: new Uint8Array(await data.arrayBuffer()), mimeType }
}

export async function removePrivateImage(admin: DatabaseClient, path: string): Promise<void> {
  const { error } = await admin.storage.from(STORAGE_BUCKET).remove([path])
  if (error) throw new AppError("storage_delete_failed", "Private image could not be removed", 503, true)
}

export async function promoteTemporaryImage(
  admin: DatabaseClient,
  temporaryPath: string,
  userId: string,
  projectId: string,
  runId: string,
  artifactId: string,
  image: GeneratedImage,
): Promise<string> {
  const finalPath = `${userId}/${projectId}/${runId}/${artifactId}.${extension(image.mimeType)}`
  const { error } = await admin.storage.from(STORAGE_BUCKET).move(temporaryPath, finalPath)
  if (error) throw new AppError("storage_promote_failed", "Private image promotion failed", 503, true)
  return finalPath
}
