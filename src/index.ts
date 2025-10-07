/**
 * LogBull JavaScript/TypeScript client library
 *
 * A powerful logging library for sending logs to LogBull server
 * with support for Winston and Pino integrations.
 */

// Core exports
export { LogBullLogger } from "./core/logger";
export type {
  Config,
  LogEntry,
  LogBatch,
  LogBullResponse,
  RejectedLog,
  LogFields,
  LogFieldValue,
} from "./core/types";
export { LogLevel, LOG_LEVEL_PRIORITY } from "./core/types";

// Transport exports
export { LogBullTransport } from "./transports/winston";
export { LogBullPinoTransport, createPinoTransport } from "./transports/pino";

// Re-export for convenience
export { LogBullLogger as default } from "./core/logger";
