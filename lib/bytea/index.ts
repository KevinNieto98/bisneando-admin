// lib/bytea.ts
// Convierte lo que venga (string \x..., base64, Buffer, {type:'Buffer',data}, Uint8Array, number[]) a base64 y data URL.

function anyToUint8(value: any): Uint8Array | null {
  if (!value) return null;

  // 1) string hex con prefijo \x
  if (typeof value === "string" && value.startsWith("\\x")) {
    const hex = value.slice(2);
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      out[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return out;
  }

  // 2) string que "parece" base64 (sin validar estrictamente)
  if (typeof value === "string") {
    try {
      const buf = Buffer.from(value, "base64");
      // si la decodificación devolvió algo con longitud > 0, asumimos base64 válido
      if (buf.length > 0) return new Uint8Array(buf);
    } catch { /* continua */ }
  }

  // 3) Buffer nativo (Node)
  if (typeof Buffer !== "undefined" && Buffer.isBuffer?.(value)) {
    return new Uint8Array(value);
  }

  // 4) { type:'Buffer', data:[...] }
  if (value && typeof value === "object" && value.type === "Buffer" && Array.isArray(value.data)) {
    return new Uint8Array(value.data);
  }

  // 5) Uint8Array directamente
  if (value instanceof Uint8Array) return value;

  // 6) number[]
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    return new Uint8Array(value);
  }

  return null;
}

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export function guessImageMime(bytes: Uint8Array): string {
  const h = Buffer.from(bytes.slice(0, 8)).toString("hex");
  if (h.startsWith("89504e470d0a1a0a")) return "image/png";
  if (h.startsWith("ffd8ff")) return "image/jpeg";
  if (h.startsWith("47494638")) return "image/gif";
  if (h.startsWith("52494646")) return "image/webp"; // RIFF
  return "application/octet-stream";
}

export function toDataUrlFromUnknownImage(value: any): string | null {
  const bytes = anyToUint8(value);
  if (!bytes || bytes.length === 0) return null;
  const mime = guessImageMime(bytes);
  const b64 = bytesToBase64(bytes);
  return `data:${mime};base64,${b64}`;
}
