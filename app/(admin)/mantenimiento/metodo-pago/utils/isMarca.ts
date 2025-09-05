// src/utils/isMetodo.ts
import type { Metodo } from "./types";

export function isMetodo(v: unknown): v is Metodo {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id_metodo === "number" &&
    typeof o.nombre_metodo === "string" &&
    typeof o.is_active === "boolean"
  );
}
