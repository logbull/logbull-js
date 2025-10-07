/**
 * Winston transport integration for LogBull
 */

import type { Config, LogLevel, LogEntry, LogFields } from "../core/types";
import { Sender } from "../core/sender";
import { generateUniqueTimestamp } from "../core/timestamp";
import { validateProjectId, validateHostURL, validateAPIKey } from "../internal/validation";
import { formatMessage, ensureFields } from "../internal/formatting";

/**
 * Winston transport for LogBull
 */
export class LogBullTransport {
  private config: Config;
  private sender: Sender;

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

    // Initialize sender
    this.sender = new Sender(this.config);
  }

  /**
   * Winston log method
   * Called by Winston when a log is emitted
   * @param info - Winston log info object (any type is required by Winston's TransportStream interface)
   * @param callback - Callback to signal completion
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(info: any, callback: () => void): void {
    setImmediate(() => {
      try {
        // Convert Winston level to LogBull level
        const level = this.convertWinstonLevel(info.level);

        // Extract message
        const message = info.message || "";

        // Extract fields (everything except level, message, timestamp)
        const fields: LogFields = {};
        for (const [key, value] of Object.entries(info)) {
          if (key !== "level" && key !== "message" && key !== "timestamp") {
            fields[key] = value;
          }
        }

        // Create log entry
        const entry: LogEntry = {
          level: level,
          message: formatMessage(message),
          timestamp: generateUniqueTimestamp(),
          fields: ensureFields(fields),
        };

        // Send to LogBull
        this.sender.addLog(entry);
      } catch (error) {
        console.error(
          `LogBull Winston Transport error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // Call callback to signal completion
      callback();
    });
  }

  /**
   * Close the transport
   */
  close(): void {
    this.sender.shutdown();
  }

  /**
   * Flush pending logs
   */
  flush(): void {
    this.sender.flush();
  }

  /**
   * Shutdown and wait for logs to be sent
   */
  async shutdown(): Promise<void> {
    await this.sender.shutdown();
  }

  /**
   * Convert Winston log level to LogBull log level
   */
  private convertWinstonLevel(level: string): string {
    const normalized = level.toLowerCase();

    switch (normalized) {
      case "error":
        return "ERROR";
      case "warn":
      case "warning":
        return "WARNING";
      case "info":
      case "http":
        return "INFO";
      case "verbose":
      case "debug":
      case "silly":
        return "DEBUG";
      default:
        return "INFO";
    }
  }
}
