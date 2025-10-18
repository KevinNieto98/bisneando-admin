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




export type UpdateUsuarioInput = {
  id: string;
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
  dni?: string | null; // puede venir con o sin guiones
};

const toDniRaw = (v: string | null | undefined) => {
  if (v === undefined) return undefined; // no cambiar
  if (v === null) return null;           // limpiar
  const raw = v.replace(/\D/g, "").slice(0, 13);
  return raw.length ? raw : null;
};

export async function updateUsuarioPerfilAction(input: UpdateUsuarioInput) {
  const { id, nombre, apellido, telefono, dni } = input;
  if (!id) throw new Error("Falta el id de usuario");

  // 1) Traer estado actual para comparar teléfono
  const { data: current, error: errCurrent } = await supabase
    .from("tbl_usuarios")
    .select("id, nombre, apellido, phone, phone_verified, dni")
    .eq("id", id)
    .single();

  if (errCurrent) throw new Error(errCurrent.message);
  if (!current) throw new Error("Usuario no encontrado");

  // 2) Normalizar entradas
  const nextDni = toDniRaw(dni);
  const nextTelefono = telefono ?? undefined; // undefined = no cambiar; null = limpiar

  // 3) Si cambia teléfono, forzar phone_verified=false
  let nextPhoneVerified: boolean | undefined = undefined;
  if (nextTelefono !== undefined) {
    const changed = (nextTelefono ?? null) !== (current.phone ?? null);
    if (changed) nextPhoneVerified = false;
  }

  // 4) Construir update solo con cambios
  const update: Record<string, any> = {};
  if (nombre !== undefined && nombre !== current.nombre) update.nombre = nombre;
  if (apellido !== undefined && apellido !== current.apellido) update.apellido = apellido;
  if (nextTelefono !== undefined && nextTelefono !== current.phone) update.phone = nextTelefono;
  if (nextDni !== undefined && nextDni !== (current.dni ?? null)) update.dni = nextDni;
  if (nextPhoneVerified !== undefined && nextPhoneVerified !== current.phone_verified) {
    update.phone_verified = nextPhoneVerified;
  }

  // Nada que actualizar
  if (Object.keys(update).length === 0) {
    return {
      id: current.id,
      nombre: current.nombre,
      apellido: current.apellido,
      phone: current.phone,
      phone_verified: current.phone_verified,
      dni: current.dni,
      _noChange: true,
    };
  }

  // 5) Ejecutar update
  const { data, error } = await supabase
    .from("tbl_usuarios")
    .update(update)
    .eq("id", id)
    .select("id, nombre, apellido, phone, phone_verified, dni")
    .single();

  if (error) throw new Error(error.message);
  return data as {
    id: string;
    nombre: string | null;
    apellido: string | null;
    phone: string | null;
    phone_verified: boolean | null;
    dni: string | null; // crudo (13 dígitos) o null
  };
}

