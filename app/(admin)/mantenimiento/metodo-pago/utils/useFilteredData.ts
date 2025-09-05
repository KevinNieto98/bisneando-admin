// src/utils/useFilteredData.ts
import { useMemo } from "react";
import type { Metodo } from "./types";

export function useFilteredData(data: Metodo[], query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((m) =>
      [m.id_metodo.toString(), m.nombre_metodo.toLowerCase()].some((s) => s.includes(q))
    );
  }, [data, query]);
}
