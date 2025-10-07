/**
 * Validation utilities for LogBull inputs
 */

import type { LogFields } from "../core/types";

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const API_KEY_PATTERN = /^[a-zA-Z0-9_\-.]{10,}$/;

const MAX_MESSAGE_LENGTH = 10_000;
const MAX_FIELDS_COUNT = 100;
const MAX_FIELD_KEY_LENGTH = 100;

/**
 * Validate project ID (must be UUID format)
 */
export function validateProjectId(projectId: string): void {
  const trimmed = projectId.trim();

  if (!trimmed) {
    throw new Error("Project ID cannot be empty");
  }

  if (!UUID_PATTERN.test(trimmed)) {
    throw new Error(
      `Invalid project ID format '${projectId}'. Must be a valid UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
    );
  }
}

/**
 * Validate host URL (must be http or https)
 */
export function validateHostURL(host: string): void {
  const trimmed = host.trim();

  if (!trimmed) {
    throw new Error("Host URL cannot be empty");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch (error) {
    throw new Error(
      `Invalid host URL format: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Host URL must use http or https scheme, got: ${url.protocol}`);
  }

  if (!url.host) {
    throw new Error("Host URL must have a host component");
  }
}

/**
 * Validate API key (min 10 chars, alphanumeric + _-.)
 */
export function validateAPIKey(apiKey: string): void {
  const trimmed = apiKey.trim();

  if (trimmed.length < 10) {
    throw new Error("API key must be at least 10 characters long");
  }

  if (!API_KEY_PATTERN.test(trimmed)) {
    throw new Error(
      "Invalid API key format. API key must contain only alphanumeric characters, underscores, hyphens, and dots"
    );
  }
}

/**
 * Validate log message (non-empty, max length)
 */
export function validateLogMessage(message: string): void {
  const trimmed = message.trim();

  if (!trimmed) {
    throw new Error("Log message cannot be empty");
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(
      `Log message too long (${trimmed.length} chars). Maximum allowed: ${MAX_MESSAGE_LENGTH}`
    );
  }
}

/**
 * Validate log fields (max count, key length)
 */
export function validateLogFields(fields: LogFields): void {
  if (!fields) {
    return;
  }

  const keys = Object.keys(fields);

  if (keys.length > MAX_FIELDS_COUNT) {
    throw new Error(`Too many fields (${keys.length}). Maximum allowed: ${MAX_FIELDS_COUNT}`);
  }

  for (const key of keys) {
    const trimmedKey = key.trim();

    if (!trimmedKey) {
      throw new Error("Field key cannot be empty");
    }

    if (trimmedKey.length > MAX_FIELD_KEY_LENGTH) {
      throw new Error(
        `Field key too long (${trimmedKey.length} chars). Maximum: ${MAX_FIELD_KEY_LENGTH}`
      );
    }
  }
}
