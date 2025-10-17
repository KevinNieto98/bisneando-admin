// lib/otp.ts
import crypto from "crypto";

/** Genera un OTP numérico de N dígitos (por defecto 6). */
export function generateNumericOtp(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max));
}

/** Hash SHA-256 del OTP con un “contexto” (salt derivado). */
export function hashOtp(
  otp: string,
  context: { uid: string; id_accion: string; expires_at_iso: string }
) {
  const saltContext = `${context.uid}|${context.id_accion}|${context.expires_at_iso}`;
  return crypto.createHash("sha256").update(`${otp}|${saltContext}`).digest("hex");
}

/** Comparación segura de strings hex (tamaño fijo). */
export function timingSafeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
