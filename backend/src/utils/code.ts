import crypto from "crypto";

// 31-character alphabet without ambiguous characters (strictly NO 0, O, 1, I, L)
export const UNAMBIGUOUS_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generate a non-sequential, unguessable public code for an Eco Enzyme batch.
 * Format: EE-<YYMM>-<6 chars> (e.g. EE-2610-A7K9X2)
 * Ambiguous characters (0/O, 1/I/L) are strictly excluded to avoid user misreading on physical gallon stickers.
 */
export function generatePublicBatchCode(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");

  const bytes = crypto.randomBytes(6);
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += UNAMBIGUOUS_ALPHABET[bytes[i] % UNAMBIGUOUS_ALPHABET.length];
  }

  return `EE-${yy}${mm}-${randomPart}`;
}

/**
 * Normalize code for resilient search and scanning:
 * Trims whitespace and converts to uppercase.
 */
export function normalizeBatchCode(code: string): string {
  if (!code) return "";
  return code.trim().toUpperCase();
}

/**
 * Check if string looks like an Eco Enzyme public code or batch code
 */
export function isValidPublicCodePattern(code: string): boolean {
  if (!code) return false;
  const normalized = normalizeBatchCode(code);
  return /^[A-Z0-9\-_]{3,30}$/.test(normalized);
}
