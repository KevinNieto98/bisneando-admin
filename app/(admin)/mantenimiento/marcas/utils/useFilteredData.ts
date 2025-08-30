// src/utils/useFilteredData.ts
import { useMemo } from "react";
import type { Marca } from "./types";

export function useFilteredData(data: Marca[], query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((m) =>
      [m.id_marca.toString(), m.nombre_marca.toLowerCase()].some((s) => s.includes(q))
    );
  }, [data, query]);
}
