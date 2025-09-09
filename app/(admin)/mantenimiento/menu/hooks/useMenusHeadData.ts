// /app/menus/hooks/useMenusHeadData.ts
"use client";

import { useEffect, useState } from "react";
import {
  getMenusHeadAction,
  postMenusHeadAction,
  putMenusHeadAction,
  toggleMenusHeadActiveAction,
  MenuHeadRow,
} from "../actions";

// Genera un ID temporal seguro para la UI (negativo, evita colisiones)
const tempId = () => -Date.now();

// nextId por si prefieres consecutivo local (no lo uses si hay concurrencia)
const nextId = (rows: { id_menu_head: number | null }[]) => {
  const nums = rows.map(r => Number(r.id_menu_head ?? 0)).filter(n => Number.isFinite(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
};

export function useMenusHeadData() {
  const [data, setData] = useState<MenuHeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await getMenusHeadAction();
        setData(rows ?? []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Error al cargar Menú Head");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** Crear con UI optimista y reemplazo por el registro real */
  const createItem = async ({ nombre, is_active }: { nombre: string; is_active: boolean }) => {
    // 1) Inserta un placeholder optimista
    const optimistic: MenuHeadRow = {
      id_menu_head: tempId(), // o nextId(data)
      nombre: (nombre ?? "").toUpperCase(),
      is_active: !!is_active,
    };
    setData(prev => [...prev, optimistic]);

    try {
      // 2) Llama al server
      const created = await postMenusHeadAction({ nombre, is_active });

      // A veces el backend puede devolver id null: saneamos
      const finalId =
        created?.id_menu_head ?? nextId([...data, optimistic]); // fallback

      const fixed: MenuHeadRow = {
        id_menu_head: finalId,
        nombre: (created?.nombre ?? nombre).toUpperCase(),
        is_active: created?.is_active ?? is_active,
      };

      // 3) Reemplaza el placeholder por el registro “real”
      setData(prev =>
        prev.map(r => (r.id_menu_head === optimistic.id_menu_head ? fixed : r))
      );

      return fixed;
    } catch (e) {
      // 4) Rollback si falla
      setData(prev => prev.filter(r => r.id_menu_head !== optimistic.id_menu_head));
      throw e;
    }
  };

  /** Update normal (si id fuese null por algún motivo, no hace nada) */
  const updateItem = async (row: MenuHeadRow) => {
    if (row.id_menu_head == null) return row; // evita crash si llega null
    const updated = await putMenusHeadAction(row);
    const fixed: MenuHeadRow = {
      id_menu_head: updated?.id_menu_head ?? row.id_menu_head,
      nombre: (updated?.nombre ?? row.nombre).toUpperCase(),
      is_active: updated?.is_active ?? row.is_active,
    };
    setData(prev => prev.map(r => (r.id_menu_head === row.id_menu_head ? fixed : r)));
    return fixed;
  };

  /** Toggle con UI optimista y rollback */
  const toggleActive = async (id_menu_head: number, next?: boolean) => {
    // Optimista
    setData(prev =>
      prev.map(r =>
        r.id_menu_head === id_menu_head
          ? { ...r, is_active: typeof next === "boolean" ? next : !r.is_active }
          : r
      )
    );
    try {
      const updated = await toggleMenusHeadActiveAction(id_menu_head, next);
      setData(prev =>
        prev.map(r => (r.id_menu_head === id_menu_head ? updated : r))
      );
      return updated;
    } catch (e) {
      // Rollback
      setData(prev =>
        prev.map(r =>
          r.id_menu_head === id_menu_head ? { ...r, is_active: !r.is_active } : r
        )
      );
      throw e;
    }
  };

  return { data, loading, error, createItem, updateItem, toggleActive };
}
