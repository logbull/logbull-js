/**
 * Tests for formatting utilities
 */

import { formatMessage, ensureFields, mergeFields } from "../../src/internal/formatting";

describe("Formatting", () => {
  describe("formatMessage", () => {
    it("should return trimmed message", () => {
      expect(formatMessage("  test message  ")).toBe("test message");
    });

    it("should truncate long messages", () => {
      const longMessage = "a".repeat(11000);
      const result = formatMessage(longMessage);

      expect(result.length).toBe(10000);
      expect(result.endsWith("...")).toBe(true);
    });

    it("should handle empty message", () => {
      expect(formatMessage("")).toBe("");
    });
  });

  describe("ensureFields", () => {
    it("should return formatted fields", () => {
      const fields = { user_id: "12345", count: 42 };
      const result = ensureFields(fields);

      expect(result).toEqual({ user_id: "12345", count: 42 });
    });

    it("should handle null/undefined", () => {
      expect(ensureFields(null as any)).toEqual({});
      expect(ensureFields(undefined as any)).toEqual({});
    });

    it("should trim field keys", () => {
      const fields = { "  user_id  ": "12345" };
      const result = ensureFields(fields);

      expect(result).toEqual({ user_id: "12345" });
    });

    it("should skip empty keys", () => {
      const fields = { "": "value", user_id: "12345" };
      const result = ensureFields(fields);

      expect(result).toEqual({ user_id: "12345" });
    });

    it("should handle non-serializable values", () => {
      const fields = {
        channel: () => {
          /* function */
        },
      };
      const result = ensureFields(fields);

      expect(result.channel).toBeDefined();
      // Functions get converted to JSON, which is "{}"
      expect(result.channel).toBeDefined();
    });
  });

  describe("mergeFields", () => {
    it("should merge two objects", () => {
      const base = { user_id: "12345", role: "admin" };
      const additional = { action: "login" };
      const result = mergeFields(base, additional);

      expect(result).toEqual({
        user_id: "12345",
        role: "admin",
        action: "login",
      });
    });

    it("should override values", () => {
      const base = { user_id: "12345", count: 10 };
      const additional = { count: 20 };
      const result = mergeFields(base, additional);

      expect(result).toEqual({ user_id: "12345", count: 20 });
    });

    it("should handle null base", () => {
      const additional = { action: "login" };
      const result = mergeFields(null as any, additional);

      expect(result).toEqual({ action: "login" });
    });

    it("should handle null additional", () => {
      const base = { user_id: "12345" };
      const result = mergeFields(base, null as any);

      expect(result).toEqual({ user_id: "12345" });
    });

    it("should handle both null", () => {
      const result = mergeFields(null as any, null as any);

      expect(result).toEqual({});
    });
  });
});
