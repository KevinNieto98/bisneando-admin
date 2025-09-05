// src/utils/useMetodosData.ts
import { useEffect, useState } from "react";
import type { Metodo } from "./types";
import { getMetodosAction, postMetodosAction, putMetodo } from "../actions";

export function useMetodosData() {
  const [data, setData] = useState<Metodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const metodos = await getMetodosAction();
      setData(metodos);
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
        const Metodos = await getMetodosAction();
        if (mounted) setData(Metodos);
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
    const current = data.find((m) => m.id_metodo === id);
    if (!current) return;
    const newActive = typeof next === "boolean" ? next : !current.is_active;

    // Optimistic UI
    setData((prev) =>
      prev.map((m) => (m.id_metodo === id ? { ...m, is_active: newActive } : m))
    );

    try {
      await putMetodo(id, current.nombre_metodo, newActive);
    } catch (e) {
      // Rollback
      setData((prev) =>
        prev.map((m) => (m.id_metodo === id ? { ...m, is_active: current.is_active } : m))
      );
      throw e;
    }
  };

  const createMetodo = async (m: Omit<Metodo, "id_metodo">) => {
    await postMetodosAction(m.nombre_metodo, m.is_active);
    await fetchData();
  };

  const updateMetodo = async (m: Metodo) => {
    await putMetodo(m.id_metodo, m.nombre_metodo, m.is_active);
    await fetchData();
  };

  return { data, setData, loading, error, fetchData, toggleDisponible, createMetodo, updateMetodo };
}
