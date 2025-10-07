/**
 * Log levels supported by LogBull
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

/**
 * Type for log field values - can be any JSON-serializable value
 * This includes: string, number, boolean, null, arrays, and plain objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LogFieldValue = any;

/**
 * Type for log fields object
 */
export type LogFields = Record<string, LogFieldValue>;

/**
 * Configuration for LogBull logger
 */
export interface Config {
  /** LogBull project ID (UUID format) */
  projectId: string;
  /** LogBull server URL (e.g., http://localhost:4005) */
  host: string;
  /** Optional API key for authentication */
  apiKey?: string;
  /** Minimum log level to process (default: INFO) */
  logLevel?: LogLevel;
}

/**
 * Single log entry structure
 */
export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  fields: LogFields;
}

/**
 * Batch of log entries sent to server
 */
export interface LogBatch {
  logs: LogEntry[];
}

/**
 * Response from LogBull server
 */
export interface LogBullResponse {
  accepted: number;
  rejected: number;
  message?: string;
  errors?: RejectedLog[];
}

/**
 * Information about rejected logs
 */
export interface RejectedLog {
  index: number;
  message: string;
}

/**
 * Priority levels for filtering
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 10,
  [LogLevel.INFO]: 20,
  [LogLevel.WARNING]: 30,
  [LogLevel.ERROR]: 40,
  [LogLevel.CRITICAL]: 50,
};
