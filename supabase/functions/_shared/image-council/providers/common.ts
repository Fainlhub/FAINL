import { ProviderError } from "../errors.ts"

export async function providerFetch(
  provider: string,
  url: string,
  init: RequestInit,
  parentSignal: AbortSignal,
  timeoutMs = 75_000,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort("provider_timeout"), timeoutMs)
  const abort = () => controller.abort(parentSignal.reason)
  parentSignal.addEventListener("abort", abort, { once: true })
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    const timedOut = controller.signal.aborted
    throw new ProviderError(
      provider,
      timedOut ? `${provider} image request timed out` : `${provider} image request failed`,
      true,
      502,
    )
  } finally {
    clearTimeout(timeout)
    parentSignal.removeEventListener("abort", abort)
  }
}

export async function upstreamFailure(provider: string, response: Response): Promise<ProviderError> {
  const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 240)
  const retryable = response.status === 408 || response.status === 409 || response.status === 429 || response.status >= 500
  const policyBlocked = response.status === 400 && /safety|policy|moderation|content/i.test(detail)
  return new ProviderError(
    provider,
    policyBlocked ? `${provider} rejected the request for safety reasons` : `${provider} returned HTTP ${response.status}`,
    retryable,
    policyBlocked ? 422 : 502,
  )
}

export function contentType(response: Response): "image/png" | "image/jpeg" | "image/webp" | null {
  const value = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase()
  if (value === "image/png" || value === "image/jpeg" || value === "image/webp") return value
  return null
}
