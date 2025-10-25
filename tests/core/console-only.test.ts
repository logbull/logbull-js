/**
 * Tests for console-only mode (no credentials)
 */

import { LogBullLogger } from "../../src/core/logger";

describe("LogBullLogger - Console-Only Mode", () => {
  // Mock console.log to capture output
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test("should work without credentials", () => {
    const logger = new LogBullLogger();
    expect(logger).toBeDefined();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No credentials provided"));
  });

  test("should work with only projectId", () => {
    const logger = new LogBullLogger({ projectId: "12345678-1234-1234-1234-123456789012" });
    expect(logger).toBeDefined();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No credentials provided"));
  });

  test("should work with only host", () => {
    const logger = new LogBullLogger({ host: "http://localhost:4005" });
    expect(logger).toBeDefined();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No credentials provided"));
  });

  test("should log to console in console-only mode", () => {
    consoleLogSpy.mockRestore();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    const logger = new LogBullLogger();
    consoleLogSpy.mockClear(); // Clear the initialization message

    logger.info("Test message", { key: "value" });

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Test message"));
  });

  test("should handle withContext in console-only mode", () => {
    const logger = new LogBullLogger();
    const contextLogger = logger.withContext({ app: "test" });

    expect(contextLogger).toBeDefined();
    consoleLogSpy.mockClear();

    contextLogger.info("Test with context");

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Test with context"));
  });

  test("should not throw on flush in console-only mode", () => {
    const logger = new LogBullLogger();
    expect(() => logger.flush()).not.toThrow();
  });

  test("should not throw on shutdown in console-only mode", async () => {
    const logger = new LogBullLogger();
    await expect(logger.shutdown()).resolves.not.toThrow();
  });

  test("should respect log level filtering in console-only mode", () => {
    consoleLogSpy.mockRestore();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    const logger = new LogBullLogger({ logLevel: "WARNING" });
    consoleLogSpy.mockClear();

    logger.debug("Should be filtered");
    logger.info("Should be filtered");
    logger.warning("Should pass");

    // Only warning should have been logged
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Should pass"));
  });

  test("should work with full credentials (not console-only)", () => {
    const logger = new LogBullLogger({
      projectId: "12345678-1234-1234-1234-123456789012",
      host: "http://localhost:4005",
    });

    expect(logger).toBeDefined();
    // Should NOT show the console-only message
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("No credentials provided")
    );
  });
});
