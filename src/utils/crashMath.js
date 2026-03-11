export const CRASH_WAITING_MS = 5000

export function getMultiplierByElapsedMs(elapsedMs) {
  const elapsed = Math.max(0, elapsedMs) / 1000
  return +Math.exp(0.14 * elapsed).toFixed(2)
}
