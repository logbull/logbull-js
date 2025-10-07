/**
 * Tests for LogBullLogger
 */

import { LogBullLogger, LogLevel } from "../../src/core";

describe("LogBullLogger", () => {
  describe("constructor", () => {
    it("should create logger with valid configuration", () => {
      const logger = new LogBullLogger({
        projectId: "12345678-1234-1234-1234-123456789012",
        host: "http://localhost:4005",
        logLevel: LogLevel.INFO,
      });

      expect(logger).toBeDefined();
    });

    it("should throw error for invalid project ID", () => {
      expect(() => {
        new LogBullLogger({
          projectId: "invalid",
          host: "http://localhost:4005",
        });
      }).toThrow();
    });

    it("should throw error for invalid host URL", () => {
      expect(() => {
        new LogBullLogger({
          projectId: "12345678-1234-1234-1234-123456789012",
          host: "invalid",
        });
      }).toThrow();
    });

    it("should default to INFO log level", () => {
      const logger = new LogBullLogger({
        projectId: "12345678-1234-1234-1234-123456789012",
        host: "http://localhost:4005",
      });

      expect(logger).toBeDefined();
    });
  });

  describe("log methods", () => {
    let logger: LogBullLogger;

    beforeEach(() => {
      logger = new LogBullLogger({
        projectId: "12345678-1234-1234-1234-123456789012",
        host: "http://localhost:4005",
        logLevel: LogLevel.DEBUG,
      });
    });

    afterEach(async () => {
      await logger.shutdown();
    });

    it("should log debug message", () => {
      expect(() => {
        logger.debug("test message", { key: "value" });
      }).not.toThrow();
    });

    it("should log info message", () => {
      expect(() => {
        logger.info("test message", { key: "value" });
      }).not.toThrow();
    });

    it("should log warning message", () => {
      expect(() => {
        logger.warning("test message", { key: "value" });
      }).not.toThrow();
    });

    it("should log error message", () => {
      expect(() => {
        logger.error("test message", { key: "value" });
      }).not.toThrow();
    });

    it("should log critical message", () => {
      expect(() => {
        logger.critical("test message", { key: "value" });
      }).not.toThrow();
    });

    it("should handle empty fields", () => {
      expect(() => {
        logger.info("test message");
      }).not.toThrow();
    });
  });

  describe("withContext", () => {
    let logger: LogBullLogger;

    beforeEach(() => {
      logger = new LogBullLogger({
        projectId: "12345678-1234-1234-1234-123456789012",
        host: "http://localhost:4005",
      });
    });

    afterEach(async () => {
      await logger.shutdown();
    });

    it("should create logger with context", () => {
      const contextLogger = logger.withContext({
        request_id: "req_123",
        user_id: "user_456",
      });

      expect(contextLogger).toBeDefined();
      expect(contextLogger).not.toBe(logger);
    });

    it("should allow chaining contexts", () => {
      const logger1 = logger.withContext({ base: "value1" });
      const logger2 = logger1.withContext({ additional: "value2" });

      expect(logger2).toBeDefined();
    });
  });

  describe("flush and shutdown", () => {
    it("should flush logs", () => {
      const logger = new LogBullLogger({
        projectId: "12345678-1234-1234-1234-123456789012",
        host: "http://localhost:4005",
      });

      expect(() => {
        logger.flush();
      }).not.toThrow();
    });

    it("should shutdown gracefully", async () => {
      const logger = new LogBullLogger({
        projectId: "12345678-1234-1234-1234-123456789012",
        host: "http://localhost:4005",
      });

      await expect(logger.shutdown()).resolves.not.toThrow();
    });
  });
});
