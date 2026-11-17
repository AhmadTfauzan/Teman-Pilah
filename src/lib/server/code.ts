import crypto from "crypto";

export const UNAMBIGUOUS_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

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

export function normalizeBatchCode(code: string): string {
  if (!code) return "";
  return code.trim().toUpperCase();
}

export function isValidPublicCodePattern(code: string): boolean {
  if (!code) return false;
  const normalized = normalizeBatchCode(code);
  return /^[A-Z0-9\-_]{3,30}$/.test(normalized);
}

