/**
 * Simple structured logger for the SDK.
 * Does NOT include Telegram alerts (that's app-level concern).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env["LOG_LEVEL"]?.toLowerCase();
  if (env && env in LEVEL_ORDER) return env as LogLevel;
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[getMinLevel()];
}

function formatMessage(
  level: LogLevel,
  context: string,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] [sdk:${context}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

export function createLogger(context: string) {
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      if (!shouldLog("debug")) return;
      process.stderr.write(formatMessage("debug", context, message, meta) + "\n");
    },
    info(message: string, meta?: Record<string, unknown>) {
      if (!shouldLog("info")) return;
      process.stderr.write(formatMessage("info", context, message, meta) + "\n");
    },
    warn(message: string, meta?: Record<string, unknown>) {
      if (!shouldLog("warn")) return;
      process.stderr.write(formatMessage("warn", context, message, meta) + "\n");
    },
    error(message: string, error?: unknown, meta?: Record<string, unknown>) {
      if (!shouldLog("error")) return;
      const errMsg =
        error instanceof Error ? error.message : error ? String(error) : "";
      const stack = error instanceof Error ? error.stack : undefined;
      const fullMeta = {
        ...meta,
        ...(errMsg ? { error: errMsg } : {}),
        ...(stack ? { stack } : {}),
      };
      process.stderr.write(
        formatMessage("error", context, message, fullMeta) + "\n",
      );
    },
  };
}
