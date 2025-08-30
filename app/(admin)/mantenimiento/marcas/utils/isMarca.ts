// src/utils/isMarca.ts
import type { Marca } from "./types";

export function isMarca(v: unknown): v is Marca {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id_marca === "number" &&
    typeof o.nombre_marca === "string" &&
    typeof o.is_active === "boolean"
  );
}
