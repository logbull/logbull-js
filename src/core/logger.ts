/**
 * LogBull standalone logger
 * Provides a simple logging interface with context management
 */

import type { Config, LogEntry, LogLevel, LogFields } from "./types";
import { LOG_LEVEL_PRIORITY } from "./types";
import { Sender } from "./sender";
import { generateUniqueTimestamp } from "./timestamp";
import {
  validateProjectId,
  validateHostURL,
  validateAPIKey,
  validateLogMessage,
  validateLogFields,
} from "../internal/validation";
import { formatMessage, ensureFields, mergeFields } from "../internal/formatting";

export class LogBullLogger {
  private config: Config;
  private sender: Sender;
  private minLevel: LogLevel;
  private context: LogFields;

  constructor(config: Config) {
    // Trim and set defaults
    this.config = {
      projectId: config.projectId.trim(),
      host: config.host.trim(),
      apiKey: config.apiKey?.trim(),
      logLevel: config.logLevel || ("INFO" as LogLevel),
    };

    // Validate configuration
    validateProjectId(this.config.projectId);
    validateHostURL(this.config.host);

    if (this.config.apiKey) {
      validateAPIKey(this.config.apiKey);
    }

    // Initialize sender and context
    this.sender = new Sender(this.config);
    this.minLevel = this.config.logLevel!;
    this.context = {};
  }

  /**
   * Log debug message
   */
  debug(message: string, fields?: LogFields): void {
    this.log("DEBUG" as LogLevel, message, fields || {});
  }

  /**
   * Log info message
   */
  info(message: string, fields?: LogFields): void {
    this.log("INFO" as LogLevel, message, fields || {});
  }

  /**
   * Log warning message
   */
  warning(message: string, fields?: LogFields): void {
    this.log("WARNING" as LogLevel, message, fields || {});
  }

  /**
   * Log error message
   */
  error(message: string, fields?: LogFields): void {
    this.log("ERROR" as LogLevel, message, fields || {});
  }

  /**
   * Log critical message
   */
  critical(message: string, fields?: LogFields): void {
    this.log("CRITICAL" as LogLevel, message, fields || {});
  }

  /**
   * Create a new logger with additional context
   * The new logger shares the same sender
   */
  withContext(context: LogFields): LogBullLogger {
    const newLogger = Object.create(LogBullLogger.prototype);

    newLogger.config = this.config;
    newLogger.sender = this.sender;
    newLogger.minLevel = this.minLevel;
    newLogger.context = mergeFields(this.context, context);

    return newLogger;
  }

  /**
   * Force send all queued logs immediately
   */
  flush(): void {
    this.sender.flush();
  }

  /**
   * Stop processing and send remaining logs
   */
  async shutdown(): Promise<void> {
    await this.sender.shutdown();
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, fields: LogFields): void {
    // Check level filtering
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    // Validate inputs
    try {
      validateLogMessage(message);
      validateLogFields(fields);
    } catch (error) {
      console.error(
        `LogBull: invalid log: ${error instanceof Error ? error.message : String(error)}`
      );
      return;
    }

    // Merge context and fields
    const mergedFields = mergeFields(this.context, fields);

    // Create log entry
    const entry: LogEntry = {
      level: level,
      message: formatMessage(message),
      timestamp: generateUniqueTimestamp(),
      fields: ensureFields(mergedFields),
    };

    // Print to console
    this.printToConsole(entry);

    // Send to LogBull
    this.sender.addLog(entry);
  }

  /**
   * Print log entry to console
   */
  private printToConsole(entry: LogEntry): void {
    let output = `[${entry.timestamp}] [${entry.level}] ${entry.message}`;

    // Add fields if present
    const fieldKeys = Object.keys(entry.fields);
    if (fieldKeys.length > 0) {
      const fieldStrings = fieldKeys.map((key) => `${key}=${entry.fields[key]}`);
      output += ` (${fieldStrings.join(", ")})`;
    }

    // Use appropriate console method
    if (entry.level === "ERROR" || entry.level === "CRITICAL") {
      console.error(output);
    } else {
      console.log(output);
    }
  }
}
