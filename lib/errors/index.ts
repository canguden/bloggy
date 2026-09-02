/**
 * Domain error hierarchy. Server actions and route handlers catch these at
 * the boundary and translate them into safe, actionable user messages —
 * unexpected errors are logged and reported generically, never leaked.
 */
export class AppError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "not_found");
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have access to this resource") {
    super(message, "forbidden");
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "validation_error");
    this.name = "ValidationError";
  }
}

/** A failure in a provider we don't control (DataForSEO, OpenAI, ...). */
export class ProviderError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = "ProviderError";
  }
}

/**
 * Maps a caught error to a message safe to show a user. Unknown errors are
 * logged server-side with full detail and surfaced generically.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  console.error("Unexpected error", error);
  return "Something went wrong. Please try again.";
}
