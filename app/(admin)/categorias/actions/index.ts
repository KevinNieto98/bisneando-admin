import { supabase } from "@/utils/supabase/client";

// ./actions.ts
export type CategoriaRow = {
  id_categoria: number
  nombre_categoria: string
  is_active: boolean
  icono?: string | null
}

/** Obtiene todas las categorías desde tbl_categorias y las mapea al shape del front */
export async function getCategoriasAction() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY // o ANON_KEY

  if (!base || !apiKey) {
    console.error('Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    return []
  }

  const url = `${base}/rest/v1/tbl_categorias?select=id_categoria,nombre_categoria,is_active,icono&order=id_categoria.asc`

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error('Error al obtener categorías:', res.status, await res.text())
    return []
  }

  const rows: CategoriaRow[] = await res.json()

  // mapeo al tipo del front
  return rows.map((r) => ({
    id_categoria: r.id_categoria,
    nombre_categoria: r.nombre_categoria,
    activa: r.is_active,
    icono: r.icono ?? null,
  }))
}


export async function postCategoriasAction(
  nombre_categoria: string,
  is_active: boolean,
  icono: string
) {
  const { data, error } = await supabase
    .from("tbl_categorias")
    .insert([{ nombre_categoria, is_active, icono }])
    .select()
    .single(); // <- nos quedamos con 1 fila

  if (error) throw new Error(error.message);

  return data as {
    id_categoria: number;
    nombre_categoria: string;
    is_active: boolean;
    icono: string;
  };
}