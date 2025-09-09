import * as Lucide from "lucide-react";

export type MenuDB = {
  id_menu: number;
  nombre: string;
  subtitulo: string | null;
  href: string;
  icon_name: string | null;
  menu: string | null;
  is_active: boolean;
};

export type MenuUI = {
  id_menu: number;
  nombre: string;
  subtitulo?: string | null;
  href: string;
  iconName?: string | null;
  menu?: string | null;
  activa: boolean;
};

export function mapDbToUi(row: MenuDB): MenuUI {
  return {
    id_menu: row.id_menu,
    nombre: row.nombre,
    subtitulo: row.subtitulo,
    href: row.href,
    iconName: row.icon_name,
    menu: row.menu,
    activa: row.is_active,
  };
}

export function mapUiToDb(row: MenuUI): Omit<MenuDB, "id_menu"> {
  return {
    nombre: row.nombre,
    subtitulo: row.subtitulo ?? null,
    href: row.href,
    icon_name: row.iconName ?? null,
    menu: row.menu ?? null,
    is_active: row.activa,
  };
}

export type AnyIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export function getIconByName(name?: string | null): AnyIcon | null {
  if (!name) return null;
  const ICONS = Lucide as unknown as Record<string, AnyIcon>;
  const Icon = ICONS[name as keyof typeof ICONS] as AnyIcon | undefined;
  return Icon ?? null;
}

export function ensureIcon(icon?: string | null, fallback = "PanelsTopLeft") {
  return icon ?? fallback;
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterMenus<T extends {
  id_menu: number;
  nombre: string;
  subtitulo?: string | null;
  href: string;
  iconName?: string | null;
  menu?: string | null;
}>(data: T[], query: string) {
  const q = normalize(query.trim());
  if (!q) return data;
  return data.filter((m) =>
    [
      String(m.id_menu),
      normalize(m.nombre),
      normalize(m.subtitulo || ""),
      normalize(m.href),
      normalize(m.iconName || ""),
      normalize(m.menu || ""),
    ].some((val) => val.includes(q)),
  );
}

export function totalPages(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function clampPage(page: number, pages: number) {
  return Math.min(Math.max(1, page), pages);
}

export function slicePage<T>(data: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

export function nextId<T extends { id_menu: number }>(arr: T[]) {
  return (arr.reduce((max, c) => (c.id_menu > max ? c.id_menu : max), 0) || 0) + 1;
}

