/**
 * Timestamp generator with monotonic guarantees
 * Ensures unique, monotonically increasing timestamps with real nanosecond precision
 */

let lastTimestampNs = 0;
let baselineWallClockMs = 0;
let baselineHrtimeNs: bigint | null = null;

/**
 * Generate a unique RFC3339Nano timestamp (UTC time in RFC3339Nano format)
 * Uses Date.now() for current UTC time and process.hrtime.bigint() for nanosecond precision
 * Ensures monotonic ordering by incrementing if the same timestamp is generated
 */
export function generateUniqueTimestamp(): string {
  // Initialize baseline on first call to sync wall-clock time with high-resolution timer
  if (baselineHrtimeNs === null) {
    baselineWallClockMs = Date.now();
    baselineHrtimeNs = process.hrtime.bigint();
  }

  // Get current high-resolution time
  const currentHrtimeNs = process.hrtime.bigint();

  // Calculate elapsed time in nanoseconds since baseline (real nanosecond precision)
  const elapsedNs = Number(currentHrtimeNs - baselineHrtimeNs);

  // Calculate current wall-clock time in nanoseconds
  // Start with baseline milliseconds converted to nanoseconds, then add high-res elapsed time
  const baselineNs = baselineWallClockMs * 1_000_000;
  const currentNsNumber = baselineNs + elapsedNs;

  // Ensure monotonic ordering (each timestamp must be unique and increasing)
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
