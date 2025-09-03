// app/api/portadas/[id]/imagen/route.ts

import { getPortadaAction } from "@/app/(admin)/mantenimiento/portadas/actions";

// Helper para normalizar lo que venga
function normalizeToUint8(value: any): Uint8Array | null {
  if (!value) return null;

  if (typeof value === "string" && value.startsWith("\\x")) {
    // Hex string de Postgres BYTEA
    const hex = value.slice(2);
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
  }

  if (typeof value === "string") {
    try {
      const buf = Buffer.from(value, "base64");
      return new Uint8Array(buf);
    } catch {}
  }

  // Node Buffer
  if (typeof Buffer !== "undefined" && Buffer.isBuffer?.(value)) {
    return new Uint8Array(value);
  }

  // { type:'Buffer', data:[...] }
  if (value && typeof value === "object" && value.type === "Buffer" && Array.isArray(value.data)) {
    return new Uint8Array(value.data);
  }

  if (value instanceof Uint8Array) {
    // ⚠️ creamos copia real para quitar SharedArrayBuffer
    return new Uint8Array(value.buffer.slice(0));
  }

  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    return new Uint8Array(value);
  }

  return null;
}

function guessMime(bytes: Uint8Array): string {
  const hex = Buffer.from(bytes.slice(0, 8)).toString("hex");
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("47494638")) return "image/gif";
  if (hex.startsWith("52494646")) return "image/webp";
  return "application/octet-stream";
}

// Fuerza runtime node para poder usar Buffer sin problemas
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return new Response("ID inválido", { status: 400 });

  const portada = await getPortadaAction(id);

  const bytes = normalizeToUint8(portada.imagen);
  if (!bytes || bytes.length === 0) return new Response("No image", { status: 404 });

  const mime = guessMime(bytes);

  // ✅ convertimos a Buffer explícito (Node) → siempre aceptado en Response
  const buf = Buffer.from(bytes);

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Cache-Control": "no-store",
    },
  });
}
