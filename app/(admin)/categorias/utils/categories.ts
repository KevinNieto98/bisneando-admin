// /utils/categories.ts

export type CategoriaDB = {
  id_categoria: number;
  nombre_categoria: string;
  is_active: boolean;
  icono?: string | null;
};

export type CategoriaUI = {
  id_categoria: number;
  nombre_categoria: string;
  activa: boolean;
  icono?: string | null;
};

/** Mapea una fila de la BD al shape del front */
export function mapDbToUi(row: CategoriaDB): CategoriaUI {
  return {
    id_categoria: row.id_categoria,
    nombre_categoria: row.nombre_categoria,
    activa: row.is_active,
    icono: row.icono ?? null,
  };
}

/** Prepara el payload para INSERT/UPDATE en Supabase desde el shape del front */
export function mapUiToDb(row: CategoriaUI): Omit<CategoriaDB, "id_categoria"> {
  return {
    nombre_categoria: row.nombre_categoria,
    is_active: row.activa,
    icono: row.icono ?? null,
  };
}

/** Asegura un icono por defecto para no romper UI */
export function ensureIcon(icon?: string | null, fallback = "Tags") {
  return icon ?? fallback;
}

/** Siguiente ID local (para placeholders/edición antes de crear) */
export function nextId<T extends { id_categoria: number }>(arr: T[]) {
  return (arr.reduce((max, c) => (c.id_categoria > max ? c.id_categoria : max), 0) || 0) + 1;
}

/** Reemplaza o inserta una categoría por id */
export function upsertById(
  list: CategoriaUI[],
  item: CategoriaUI,
): CategoriaUI[] {
  const i = list.findIndex((x) => x.id_categoria === item.id_categoria);
  if (i === -1) return [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}


