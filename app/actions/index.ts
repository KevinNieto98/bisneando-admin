// actions.ts

export type MenuKey = "PRINCIPAL" | "MANTENIMIENTO" | (string & {});
export type MenuRow = {
  id_menu: number;
  nombre: string;               // Title
  subtitulo: string | null;     // Subtitle
  href: string;                 // Ruta
  icon_name: string | null;     // Nombre del ícono
};

type MenuRowRaw = {
  id_menu: number;
  nombre: string | null;
  subtitulo: string | null;
  href: string;
  icon_name: string | null;
  menu?: string | null;
};

export async function getMenusAction(
  menu: MenuKey = "PRINCIPAL"
): Promise<MenuRow[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    console.error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    return [];
  }

  const url = new URL(`${base}/rest/v1/tbl_menus`);
  // 👇 Solo columnas que existen en tu tabla
  url.searchParams.set("select", "id_menu,nombre,subtitulo,href,icon_name");
  url.searchParams.set("menu", `eq.${menu}`);
  url.searchParams.set("order", "id_menu.asc");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener menús:", res.status, await res.text());
    return [];
  }

  const rows = (await res.json()) as MenuRowRaw[];

  // Normaliza por si vienen nulls
  return rows.map((r) => ({
    id_menu: r.id_menu,
    nombre: (r.nombre ?? "").trim(),
    subtitulo: r.subtitulo ?? null,
    href: r.href,
    icon_name: r.icon_name ?? null,
  }));
}
