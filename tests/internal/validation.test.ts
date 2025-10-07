/**
 * Tests for validation utilities
 */

import {
  validateProjectId,
  validateHostURL,
  validateAPIKey,
  validateLogMessage,
  validateLogFields,
} from "../../src/internal/validation";

describe("Validation", () => {
  describe("validateProjectId", () => {
    it("should accept valid UUID", () => {
      expect(() => {
        validateProjectId("12345678-1234-1234-1234-123456789012");
      }).not.toThrow();
    });

    it("should accept UUID with uppercase", () => {
      expect(() => {
        validateProjectId("12345678-1234-1234-1234-12345678ABCD");
      }).not.toThrow();
    });

    it("should reject empty string", () => {
      expect(() => {
        validateProjectId("");
      }).toThrow("Project ID cannot be empty");
    });

    it("should reject invalid format", () => {
      expect(() => {
        validateProjectId("invalid");
      }).toThrow("Invalid project ID format");
    });
  });

  describe("validateHostURL", () => {
    it("should accept valid http URL", () => {
      expect(() => {
        validateHostURL("http://localhost:4005");
      }).not.toThrow();
    });

    it("should accept valid https URL", () => {
      expect(() => {
        validateHostURL("https://logbull.example.com");
      }).not.toThrow();
    });

    it("should reject empty string", () => {
      expect(() => {
        validateHostURL("");
      }).toThrow("Host URL cannot be empty");
    });

    it("should reject invalid scheme", () => {
      expect(() => {
        validateHostURL("ftp://example.com");
      }).toThrow("Host URL must use http or https scheme");
    });

    it("should reject URL without scheme", () => {
      expect(() => {
        validateHostURL("example.com");
      }).toThrow();
    });
  });

  describe("validateAPIKey", () => {
    it("should accept valid API key", () => {
      expect(() => {
        validateAPIKey("abc123_xyz-789.test");
      }).not.toThrow();
    });

    it("should accept minimum length", () => {
      expect(() => {
        validateAPIKey("1234567890");
      }).not.toThrow();
    });

    it("should reject too short", () => {
      expect(() => {
        validateAPIKey("short");
      }).toThrow("API key must be at least 10 characters long");
    });

    it("should reject invalid characters", () => {
      expect(() => {
        validateAPIKey("invalid@key!here");
      }).toThrow("Invalid API key format");
    });
  });

  describe("validateLogMessage", () => {
    it("should accept valid message", () => {
      expect(() => {
        validateLogMessage("This is a valid log message");
      }).not.toThrow();
    });

    it("should reject empty string", () => {
      expect(() => {
        validateLogMessage("");
      }).toThrow("Log message cannot be empty");
    });

    it("should reject whitespace only", () => {
      expect(() => {
        validateLogMessage("   ");
      }).toThrow("Log message cannot be empty");
    });

    it("should reject too long message", () => {
      const longMessage = "a".repeat(10001);
      expect(() => {
        validateLogMessage(longMessage);
      }).toThrow("Log message too long");
    });
  });

  describe("validateLogFields", () => {
    it("should accept valid fields", () => {
      expect(() => {
        validateLogFields({ user_id: "12345", action: "login" });
      }).not.toThrow();
    });

    it("should accept null/undefined", () => {
      expect(() => {
        validateLogFields(null as any);
      }).not.toThrow();
    });

    it("should accept empty object", () => {
      expect(() => {
        validateLogFields({});
      }).not.toThrow();
    });

    it("should reject too many fields", () => {
      const fields: Record<string, any> = {};
      for (let i = 0; i < 101; i++) {
        fields[`field_${i}`] = i;
      }
      expect(() => {
        validateLogFields(fields);
      }).toThrow("Too many fields");
    });

    it("should reject empty field key", () => {
      expect(() => {
        validateLogFields({ "": "value" });
      }).toThrow("Field key cannot be empty");
    });
  });
});
