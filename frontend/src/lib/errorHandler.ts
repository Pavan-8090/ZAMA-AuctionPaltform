/**
 * Error Handler Utility
 * Centralized error handling with retry logic and user-friendly messages
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public retryable: boolean = false,
    public userMessage?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Extract user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage || error.message;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Wallet errors
    if (message.includes("user rejected") || message.includes("user denied")) {
      return "Transaction was cancelled. Please try again.";
    }
    if (message.includes("insufficient funds")) {
      return "Insufficient funds. Please add more ETH to your wallet.";
    }
    if (message.includes("network") || message.includes("connection")) {
      return "Network error. Please check your connection and try again.";
    }

    // Transaction errors
    if (message.includes("revert") || message.includes("execution reverted")) {
      const revertReason = extractRevertReason(error.message);
      return revertReason || "Transaction failed. Please try again.";
    }
    if (message.includes("nonce") || message.includes("replacement")) {
      return "Transaction is pending. Please wait for confirmation.";
    }
    if (message.includes("gas")) {
      return "Gas estimation failed. Please try again or increase gas limit.";
    }

    // FHE/Encryption errors
    if (message.includes("encrypt") || message.includes("decrypt")) {
      return "Encryption error. Please ensure FHEVM is initialized and try again.";
    }
    if (message.includes("relayer")) {
      return "Relayer service unavailable. Please try again in a moment.";
    }

    // Contract errors
    if (message.includes("auction") && message.includes("not")) {
      return "Auction not found or invalid.";
    }
    if (message.includes("ended") || message.includes("expired")) {
      return "Auction has ended.";
    }
    if (message.includes("active")) {
      return "Auction is not active.";
    }

    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Extract revert reason from error message
 */
function extractRevertReason(message: string): string | null {
  // Try to extract revert reason from various formats
  const patterns = [
    /revert\s+(.+)/i,
    /execution reverted:\s*(.+)/i,
    /reason:\s*(.+)/i,
    /message:\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on user cancellation
      if (
        lastError.message.includes("user rejected") ||
        lastError.message.includes("user denied")
      ) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Handle transaction errors with retry logic
 */
export async function handleTransaction<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { onError?: (error: Error) => void } = {}
): Promise<T> {
  const { onError, ...retryOptions } = options;

  try {
    return await retry(fn, retryOptions);
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(
            getErrorMessage(error),
            undefined,
            false,
            getErrorMessage(error)
          );

    if (onError) {
      onError(appError);
    }

    throw appError;
  }
}

/**
 * Log error for monitoring (can be extended to send to Sentry, etc.)
 */
export function logError(error: Error, context?: Record<string, any>) {
  console.error("Application Error:", {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
  // if (process.env.NODE_ENV === "production") {
  //   Sentry.captureException(error, { extra: context });
  // }
}

