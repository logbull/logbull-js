/**
 * Pino transport integration for LogBull
 */

import { Writable } from "stream";
import type { Config, LogLevel, LogEntry, LogFields } from "../core/types";
import { Sender } from "../core/sender";
import { generateUniqueTimestamp } from "../core/timestamp";
import { validateProjectId, validateHostURL, validateAPIKey } from "../internal/validation";
import { formatMessage, ensureFields } from "../internal/formatting";

/**
 * Pino log object structure (simplified)
 */
interface PinoLogObject {
  level: number | string;
  msg?: string;
  message?: string;
  time?: number;
  v?: number;
  pid?: number;
  hostname?: string;
  [key: string]: unknown;
}

/**
 * Pino transport for LogBull
 */
export class LogBullPinoTransport {
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
   * Pino transform function
   * Called by Pino for each log entry
   * @param chunk - Pino log chunk (can be string, Buffer, or object)
   */
  transform(chunk: unknown): void {
    try {
      // Parse Pino log object (it comes as a JSON string, Buffer, or object)
      let logObj: PinoLogObject;
      if (Buffer.isBuffer(chunk)) {
        logObj = JSON.parse(chunk.toString("utf8")) as PinoLogObject;
      } else if (typeof chunk === "string") {
        logObj = JSON.parse(chunk) as PinoLogObject;
      } else {
        logObj = chunk as PinoLogObject;
      }

      // Convert Pino level to LogBull level
      const level = this.convertPinoLevel(logObj.level);

      // Extract message
      const message = logObj.msg || logObj.message || "";

      // Extract fields (everything except level, msg, message, time, v, pid, hostname)
      const fields: LogFields = {};
      for (const [key, value] of Object.entries(logObj)) {
        if (
          key !== "level" &&
          key !== "msg" &&
          key !== "message" &&
          key !== "time" &&
          key !== "v" &&
          key !== "pid" &&
          key !== "hostname"
        ) {
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
        `LogBull Pino Transport error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
   * Convert Pino log level to LogBull log level
   * Pino levels: fatal (60), error (50), warn (40), info (30), debug (20), trace (10)
   */
  private convertPinoLevel(level: number | string): string {
    // If level is a string, convert to number
    let numLevel: number;
    if (typeof level === "string") {
      const levelMap: Record<string, number> = {
        fatal: 60,
        error: 50,
        warn: 40,
        info: 30,
        debug: 20,
        trace: 10,
      };
      numLevel = levelMap[level.toLowerCase()] || 30;
    } else {
      numLevel = level;
    }

    // Map to LogBull levels
    if (numLevel >= 60) {
      return "CRITICAL"; // fatal
    } else if (numLevel >= 50) {
      return "ERROR"; // error
    } else if (numLevel >= 40) {
      return "WARNING"; // warn
    } else if (numLevel >= 30) {
      return "INFO"; // info
    } else {
      return "DEBUG"; // debug, trace
    }
  }
}

/**
 * Create a Pino transport stream
 * This is the recommended way to use LogBull with Pino
 * @param config - LogBull configuration
 * @returns Pino writable stream
 */
export function createPinoTransport(config: Config): Writable {
  const transport = new LogBullPinoTransport(config);

  return new Writable({
    write(chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      try {
        transport.transform(chunk);
        callback();
      } catch (error) {
        callback(error instanceof Error ? error : new Error(String(error)));
      }
    },
    final(callback: (error?: Error | null) => void) {
      transport
        .shutdown()
        .then(() => callback())
        .catch((error) => callback(error instanceof Error ? error : new Error(String(error))));
    },
  });
}
