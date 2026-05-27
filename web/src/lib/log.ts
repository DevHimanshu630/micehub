import "server-only";

/**
 * Tiny JSON-to-stdout logger. Designed so that when we ship to Vercel /
 * Datadog / Axiom later, lines are already structured and parseable — no
 * find-and-replace across the codebase needed.
 *
 * Don't log secrets, tokens, full Razorpay payloads, or PII beyond user IDs.
 */

type Level = "info" | "warn" | "error";

type LogData = Record<string, unknown>;

function emit(level: Level, event: string, data?: LogData, err?: unknown) {
  const payload: Record<string, unknown> = {
    t: new Date().toISOString(),
    level,
    event,
    ...(data ?? {}),
  };

  if (err !== undefined) {
    if (err instanceof Error) {
      payload.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    } else {
      payload.error = { value: String(err) };
    }
  }

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const log = {
  info: (event: string, data?: LogData) => emit("info", event, data),
  warn: (event: string, data?: LogData) => emit("warn", event, data),
  error: (event: string, err: unknown, data?: LogData) =>
    emit("error", event, data, err),
};
