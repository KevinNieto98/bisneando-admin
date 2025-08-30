// src/utils/useMarcasData.ts
import { useEffect, useState } from "react";
import type { Marca } from "./types";
import { getMarcasAction, postTMarcasAction, putMarca } from "../actions";

export function useMarcasData() {
  const [data, setData] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const marcas = await getMarcasAction();
      setData(marcas);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const marcas = await getMarcasAction();
        if (mounted) setData(marcas);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Error desconocido");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleDisponible = async (id: number, next?: boolean) => {
    const current = data.find((m) => m.id_marca === id);
    if (!current) return;
    const newActive = typeof next === "boolean" ? next : !current.is_active;

    // Optimistic UI
    setData((prev) =>
      prev.map((m) => (m.id_marca === id ? { ...m, is_active: newActive } : m))
    );

    try {
      await putMarca(id, current.nombre_marca, newActive);
    } catch (e) {
      // Rollback
      setData((prev) =>
        prev.map((m) => (m.id_marca === id ? { ...m, is_active: current.is_active } : m))
      );
      throw e;
    }
  };

  const createMarca = async (m: Omit<Marca, "id_marca">) => {
    await postTMarcasAction(m.nombre_marca, m.is_active);
    await fetchData();
  };

  const updateMarca = async (m: Marca) => {
    await putMarca(m.id_marca, m.nombre_marca, m.is_active);
    await fetchData();
  };

  return { data, setData, loading, error, fetchData, toggleDisponible, createMarca, updateMarca };
}
