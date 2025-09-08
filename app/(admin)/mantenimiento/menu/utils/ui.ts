// /utils/ui.ts
import * as Lucide from "lucide-react";

export type AnyIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/** Obtiene un ícono de lucide por nombre de forma segura */
export function getIconByName(name?: string | null): AnyIcon | null {
  if (!name) return null;
  const ICONS = Lucide as unknown as Record<string, AnyIcon>;
  const Icon = ICONS[name as keyof typeof ICONS] as AnyIcon | undefined;
  return Icon ?? null;
}

/** Normaliza texto para búsquedas insensibles a mayúsculas/acentos básicos */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Filtra categorías por query usando id, nombre e icono */
export function filterCategorias<T extends {
  id_categoria: number;
  nombre_categoria: string;
  icono?: string | null;
}>(data: T[], query: string) {
  const q = normalize(query.trim());
  if (!q) return data;
  return data.filter((c) =>
    [
      String(c.id_categoria),
      normalize(c.nombre_categoria),
      normalize(c.icono || ""),
    ].some((val) => val.includes(q)),
  );
}

/** Total de páginas (mínimo 1) */
export function totalPages(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

/** Asegura que la página actual esté en rango */
export function clampPage(page: number, pages: number) {
  return Math.min(Math.max(1, page), pages);
}

/** Devuelve el slice de la página */
export function slicePage<T>(data: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}
