// app/marcas/actions.ts
'use server'

import { supabase } from "@/utils/supabase/client"


export async function getMarcasAction() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tbl_marcas?select=*&order=id_marca.asc`

  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY // o ANON_KEY
  if (!apiKey) {
    console.error('Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el entorno')
    return []
  }

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error('Error al obtener marcas:', res.status, await res.text())
    return []
  }

  return res.json()
}

// acciones/supabase/marcas.ts
export async function postTMarcasAction(name: string, is_active: boolean) {
  const { data, error } = await supabase
    .from('tbl_marcas')
    .insert([{ nombre_marca: name, is_active }])
    .select()
    .single(); // <- nos quedamos con 1 fila

  if (error) throw new Error(error.message);
  return data as { id_marca: number; nombre_marca: string; is_active: boolean };
}

export async function putMarca(id: number, name: string, is_active: boolean) {
  const { data, error } = await supabase
    .from('tbl_marcas') // <- corregido
    .update({ nombre_marca: name, is_active })
    .eq('id_marca', Number(id))
    .select()
    .single(); // <- devuelve una sola fila

  if (error) throw new Error(error.message);
  return data as { id_marca: number; nombre_marca: string; is_active: boolean };
}
