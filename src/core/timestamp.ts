/**
 * Timestamp generator with monotonic guarantees
 * Ensures unique, monotonically increasing timestamps
 */

let lastTimestampNs = 0;

/**
 * Generate a unique RFC3339Nano timestamp
 * Ensures monotonic ordering by incrementing if the same timestamp is generated
 */
export function generateUniqueTimestamp(): string {
  // Use process.hrtime.bigint() for high-resolution time in Node.js
  const currentNs = process.hrtime.bigint();
  const currentNsNumber = Number(currentNs);

  // Ensure monotonic ordering
  if (currentNsNumber <= lastTimestampNs) {
    lastTimestampNs = lastTimestampNs + 1;
  } else {
    lastTimestampNs = currentNsNumber;
  }

  return formatTimestamp(lastTimestampNs);
}

/**
 * Format nanosecond timestamp to RFC3339Nano format
 */
function formatTimestamp(timestampNs: number): string {
  const seconds = Math.floor(timestampNs / 1_000_000_000);
  const nanos = timestampNs % 1_000_000_000;

  const date = new Date(seconds * 1000);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const secs = String(date.getUTCSeconds()).padStart(2, "0");
  const nanosStr = String(nanos).padStart(9, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${secs}.${nanosStr}Z`;
}
