// app/Metodos/actions.ts
'use server'

import { supabase } from "@/utils/supabase/client"


export async function getMetodosAction() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tbl_metodos_pago?select=*&order=id_metodo.asc`

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
    console.error('Error al obtener Metodos:', res.status, await res.text())
    return []
  }

  return res.json()
}

// acciones/supabase/Metodos.ts
export async function postMetodosAction(name: string, is_active: boolean) {
  const { data, error } = await supabase
    .from('tbl_metodos_pago')
    .insert([{ nombre_metodo: name, is_active }])
    .select()
    .single(); // <- nos quedamos con 1 fila

  if (error) throw new Error(error.message);
  return data as { id_metodo: number; nombre_metodo: string; is_active: boolean };
}

export async function putMetodo(id: number, name: string, is_active: boolean) {
  const { data, error } = await supabase
    .from('tbl_metodos_pago') // <- corregido
    .update({ nombre_metodo: name, is_active })
    .eq('id_metodo', Number(id))
    .select()
    .single(); // <- devuelve una sola fila

  if (error) throw new Error(error.message);
  return data as { id_Metodo: number; nombre_metodo: string; is_active: boolean };
}
