/**
 * Asynchronous batch sender for LogBull
 * Handles batching, queuing, and HTTP transmission of logs
 */

import type { Config, LogEntry, LogBatch, LogBullResponse } from "./types";

const BATCH_SIZE = 1_000;
const BATCH_INTERVAL_MS = 1_000;
const QUEUE_CAPACITY = 10_000;
const HTTP_TIMEOUT_MS = 30_000;

export class Sender {
  private config: Config;
  private logQueue: LogEntry[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private stopped = false;
  private inFlightRequests = 0;

  constructor(config: Config) {
    this.config = config;
    this.startBatchProcessor();
  }

  /**
   * Add a log entry to the queue
   */
  addLog(entry: LogEntry): void {
    if (this.stopped) {
      return;
    }

    if (this.logQueue.length >= QUEUE_CAPACITY) {
      console.error("LogBull: log queue full, dropping log");
      return;
    }

    this.logQueue.push(entry);
  }

  /**
   * Force send current batch immediately
   */
  flush(): void {
    this.sendBatch();
  }

  /**
   * Stop processing and send remaining logs
   */
  async shutdown(): Promise<void> {
    if (this.stopped) {
      return;
    }

    this.stopped = true;

    // Stop the interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Send remaining logs
    this.sendBatch();

    // Wait for in-flight requests to complete (with timeout)
    const maxWaitTime = 5000; // 5 seconds
    const startTime = Date.now();

    while (this.inFlightRequests > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Start the periodic batch processor
   */
  private startBatchProcessor(): void {
    this.intervalId = setInterval(() => {
      this.sendBatch();
    }, BATCH_INTERVAL_MS);

    // Don't keep the process alive just for this interval
    if (this.intervalId.unref) {
      this.intervalId.unref();
    }
  }

  /**
   * Send a batch of logs (fire-and-forget)
   */
  private sendBatch(): void {
    if (this.logQueue.length === 0) {
      return;
    }

    // Take up to BATCH_SIZE logs from the queue
    const logsToSend = this.logQueue.splice(0, BATCH_SIZE);

    // Fire-and-forget async request
    this.sendHTTPRequest(logsToSend);
  }

  /**
   * Send HTTP request with logs batch
   */
  private async sendHTTPRequest(logs: LogEntry[]): Promise<void> {
    this.inFlightRequests++;

    try {
      const batch: LogBatch = { logs };
      const data = JSON.stringify(batch);

      const url = `${this.config.host}/api/v1/logs/receiving/${this.config.projectId}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "LogBull-JS-Client/1.0",
      };

      if (this.config.apiKey) {
        headers["X-API-Key"] = this.config.apiKey;
      }

      // Use native fetch if available (Node.js 18+), otherwise use https module
      const response = await this.makeRequest(url, data, headers);

      if (response.status !== 200 && response.status !== 202) {
        console.error(`LogBull: server returned status ${response.status}: ${response.body}`);
        return;
      }

      // Parse response
      let responseData: LogBullResponse;
      try {
        responseData = JSON.parse(response.body);
      } catch {
        return; // Ignore parse errors
      }

      // Handle rejected logs
      if (responseData.rejected > 0) {
        this.handleRejectedLogs(responseData, logs);
      }
    } catch (error) {
      console.error(
        `LogBull: HTTP request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      this.inFlightRequests--;
    }
  }

  /**
   * Make HTTP request (supports both fetch and https module)
   */
  private async makeRequest(
    url: string,
    data: string,
    headers: Record<string, string>
  ): Promise<{ status: number; body: string }> {
    // Try to use native fetch first (Node.js 18+)
    if (typeof fetch !== "undefined") {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: data,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const body = await response.text();
        return { status: response.status, body };
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    }

    // Fallback to https module for older Node.js versions
    return this.makeRequestWithHttps(url, data, headers);
  }

  /**
   * Make HTTP request using Node.js https module
   */
  private async makeRequestWithHttps(
    url: string,
    data: string,
    headers: Record<string, string>
  ): Promise<{ status: number; body: string }> {
    // Dynamic import for Node.js modules
    const { request } = await import("https");
    const { request: httpRequest } = await import("http");

    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";

    return new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(data),
        },
        timeout: HTTP_TIMEOUT_MS,
      };

      const req = (isHttps ? request : httpRequest)(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          resolve({ status: res.statusCode || 0, body });
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Handle rejected logs from server
   */
  private handleRejectedLogs(response: LogBullResponse, sentLogs: LogEntry[]): void {
    console.error(`LogBull: Rejected ${response.rejected} log entries`);

    if (response.errors && response.errors.length > 0) {
      console.error("LogBull: Rejected log details:");

      for (const error of response.errors) {
        if (error.index >= 0 && error.index < sentLogs.length) {
          const log = sentLogs[error.index];
          console.error(`  - Log #${error.index} rejected (${error.message}):`);
          console.error(`    Level: ${log.level}`);
          console.error(`    Message: ${log.message}`);
          console.error(`    Timestamp: ${log.timestamp}`);

          if (Object.keys(log.fields).length > 0) {
            console.error(`    Fields: ${JSON.stringify(log.fields)}`);
          }
        }
      }
    }
  }
}
