/**
 * Formatting utilities for log messages and fields
 */

import type { LogFields } from "../core/types";

const MAX_MESSAGE_LENGTH = 10_000;

/**
 * Format and truncate log message
 */
export function formatMessage(message: string): string {
  const trimmed = message.trim();

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return trimmed.substring(0, MAX_MESSAGE_LENGTH - 3) + "...";
  }

  return trimmed;
}

/**
 * Ensure fields are JSON-serializable and sanitize keys
 */
export function ensureFields(fields: LogFields): LogFields {
  if (!fields) {
    return {};
  }

  const formatted: LogFields = {};

  for (const [key, value] of Object.entries(fields)) {
    const trimmedKey = key.trim();

    if (!trimmedKey) {
      continue;
    }

    if (isJSONSerializable(value)) {
      formatted[trimmedKey] = value;
    } else {
      formatted[trimmedKey] = convertToString(value);
    }
  }

  return formatted;
}

/**
 * Merge two field objects, with additional overriding base
 */
export function mergeFields(base: LogFields, additional: LogFields): LogFields {
  const result = ensureFields(base);
  const additionalFormatted = ensureFields(additional);

  for (const [key, value] of Object.entries(additionalFormatted)) {
    result[key] = value;
  }

  return result;
}

/**
 * Check if a value is JSON serializable
 */
function isJSONSerializable(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert non-serializable value to string
 */
function convertToString(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
