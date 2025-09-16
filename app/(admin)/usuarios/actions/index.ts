import { supabase } from "@/utils/supabase/client"

// actions.ts
export interface Usuario {
  id: string
  nombre: string
  apellido: string
  phone: string | null
  email: string
  id_perfil: number
  is_active: boolean
}

export async function getUsuariosAction(): Promise<Usuario[]> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tbl_usuarios?select=id,nombre,apellido,phone,email,id_perfil,is_active&order=id.asc`

  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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
    console.error('Error al obtener usuarios:', res.status, await res.text())
    return []
  }

  return res.json()
}

export async function getPerfilesActivosAction() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tbl_perfiles?select=*&is_active=eq.true&order=id_perfil.asc`

  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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
    console.error('Error al obtener perfiles activos:', res.status, await res.text())
    return []
  }

  return res.json()
}


export async function putUsuarioActivo(id: string, is_active: boolean) {
  const { data, error } = await supabase
    .from("tbl_usuarios")
    .update({ is_active })
    .eq("id", id)             // 👈 nada de Number(id)
    .select("id,is_active")
    .single();

  if (error) throw new Error(error.message);
  return data as { id: string; is_active: boolean };
}


export async function getUsuarioByIdAction(id: string): Promise<Usuario | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!base || !apiKey) {
    console.error("Faltan variables de entorno de Supabase")
    return null
  }

  const url = `${base}/rest/v1/tbl_usuarios?id=eq.${id}&select=id,nombre,apellido,phone,email,id_perfil,is_active`

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    console.error("Error al obtener usuario:", res.status, await res.text())
    return null
  }

  const data = await res.json()
  // Como usamos eq.id debería venir un solo registro
  return data.length > 0 ? (data[0] as Usuario) : null
}
