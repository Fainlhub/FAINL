export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 500,
    public readonly retryable = false,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ProviderError extends AppError {
  constructor(provider: string, message: string, retryable: boolean, status = 502) {
    super(`${provider}_provider_error`, message, status, retryable)
    this.name = "ProviderError"
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : "Unknown error"
}
