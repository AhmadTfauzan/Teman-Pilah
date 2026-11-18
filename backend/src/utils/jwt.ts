import crypto from "crypto";

const INSECURE_PLACEHOLDER_SECRET = "your-super-secret-key-change-this";

let cachedDevFallbackSecret: string | null = null;
let hasWarnedPlaceholderInDev = false;

/**
 * Mengambil JWT_SECRET secara lazy.
 * - Di production (`NODE_ENV === "production"`): wajib tersedia dan tidak boleh
 *   menggunakan nilai contoh `.env.example`, jika tidak akan melempar Error.
 * - Di non-production: menggunakan `process.env.JWT_SECRET` jika tersedia,
 *   atau menghasilkan secret acak sementara per proses sambil mencatat peringatan.
 */
export const getJwtSecret = (): string => {
  const rawSecret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (!rawSecret) {
      throw new Error(
        "JWT_SECRET environment variable is required in production",
      );
    }
    if (rawSecret === INSECURE_PLACEHOLDER_SECRET) {
      throw new Error(
        "JWT_SECRET must not use the example placeholder value in production",
      );
    }
    return rawSecret;
  }

  if (rawSecret) {
    if (
      rawSecret === INSECURE_PLACEHOLDER_SECRET &&
      !hasWarnedPlaceholderInDev
    ) {
      hasWarnedPlaceholderInDev = true;
      console.warn(
        "[SECURITY] JWT_SECRET is using the example placeholder value in development. Replace it before deploying to production.",
      );
    }
    return rawSecret;
  }

  if (!cachedDevFallbackSecret) {
    cachedDevFallbackSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "[SECURITY] JWT_SECRET is not set. Using an ephemeral development-only secret for this process.",
    );
  }

  return cachedDevFallbackSecret;
};
