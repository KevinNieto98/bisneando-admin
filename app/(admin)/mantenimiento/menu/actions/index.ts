// =============================
// /app/menus/actions.ts
// =============================
import { supabase } from "@/utils/supabase/client";

export type MenuRow = {
  id_menu: number;
  nombre: string;
  subtitulo: string | null;
  href: string;
  icon_name: string | null;
  menu: string | null;
  is_active: boolean;
};

/** Obtiene todos los menús desde tbl_menus */
export async function getMenusAction() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // o ANON_KEY

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
    return [] as MenuRow[];
  }

  const url = `${base}/rest/v1/tbl_menus?select=id_menu,nombre,subtitulo,href,icon_name,menu,is_active&order=id_menu.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener menús:", res.status, await res.text());
    return [] as MenuRow[];
  }

  const rows: MenuRow[] = await res.json();
  return rows;
}

export async function postMenusAction(payload: Omit<MenuRow, "id_menu">) {
  const { data, error } = await supabase
    .from("tbl_menus")
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MenuRow;
}

export async function putMenusAction(payload: MenuRow) {
  const { id_menu, ...rest } = payload;

  const { data, error } = await supabase
    .from("tbl_menus")
    .update(rest)
    .eq("id_menu", Number(id_menu))
    .select("id_menu,nombre,subtitulo,href,icon_name,menu,is_active")
    .single();

  if (error) throw new Error(error.message);
  return data as MenuRow;
}


/** Row base que esperamos en la tabla */
export type MenuHeadRow = {
  id_menu_head: number;
  nombre: string;       // se guarda SIEMPRE en MAYÚSCULAS
  is_active: boolean;
};

/** GET por REST (rápido y sin caché) */
export async function getMenusHeadAction(): Promise<MenuHeadRow[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !apiKey) {
    console.error("Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    return [];
  }

  const url = `${baseUrl}/rest/v1/tbl_menus_head?select=*&order=id_menu_head.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener Menú Head:", res.status, await res.text());
    return [];
  }

  return res.json();
}


export async function getActiveMenuHeadAction(): Promise<MenuHeadRow[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !apiKey) {
    console.error("Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    return [];
  }

  // Trae solo los que tienen is_active = true
  const url = `${baseUrl}/rest/v1/tbl_menus_head?select=*&is_active=eq.true&order=id_menu_head.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener Menú Head activos:", res.status, await res.text());
    return [];
  }

  return res.json();
}
 
/** POST con normalización a MAYÚSCULAS */
export async function postMenusHeadAction(input: { nombre: string; is_active: boolean }): Promise<MenuHeadRow> {
  const nombreUp = (input.nombre ?? "").trim().toUpperCase();

  const { data, error } = await supabase
    .from("tbl_menus_head")
    .insert([{ nombre: nombreUp, is_active: !!input.is_active }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MenuHeadRow;
}

/** PUT con normalización a MAYÚSCULAS */
export async function putMenusHeadAction(input: { id_menu_head: number; nombre: string; is_active: boolean }): Promise<MenuHeadRow> {
  const nombreUp = (input.nombre ?? "").trim().toUpperCase();

  const { data, error } = await supabase
    .from("tbl_menus_head")
    .update({ nombre: nombreUp, is_active: !!input.is_active })
    .eq("id_menu_head", Number(input.id_menu_head))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MenuHeadRow;
}

/** Toggle rápido de is_active */
export async function toggleMenusHeadActiveAction(id_menu_head: number, next?: boolean): Promise<MenuHeadRow> {
  // lee estado actual
  const { data: current, error: err0 } = await supabase
    .from("tbl_menus_head")
    .select("id_menu_head, nombre, is_active")
    .eq("id_menu_head", Number(id_menu_head))
    .single();

  if (err0) throw new Error(err0.message);
  const newActive = typeof next === "boolean" ? next : !current.is_active;

  const { data, error } = await supabase
    .from("tbl_menus_head")
    .update({ is_active: newActive })
    .eq("id_menu_head", Number(id_menu_head))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MenuHeadRow;
}
