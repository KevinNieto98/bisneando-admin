'use server';

import { supabase } from '@/utils/supabase/client';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type UpdateEmailNombreInput = {
  id: string;         // debe ser el id del usuario logueado
  email?: string;
  nombre?: string;
};

export async function updateEmailNombreAction(input: UpdateEmailNombreInput) {
  const supabase = await createClient();

  // 1) Validar sesión y ownership
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, error: 'No hay sesión activa' };
  if (user.id !== input.id) return { ok: false, error: 'No autorizado' };

  // 2) Auth: email + user_metadata.nombre (sin phone)
  const payload: any = {};
  if (typeof input.email !== 'undefined' && input.email !== user.email) {
    payload.email = input.email; // puede requerir confirmación según settings de Auth
  }
  const meta = { ...(user.user_metadata ?? {}) };
  let touchMeta = false;
  if (typeof input.nombre !== 'undefined' && input.nombre !== meta.nombre) {
    meta.nombre = input.nombre;
    touchMeta = true;
  }
  if (touchMeta) payload.data = meta;

  if (Object.keys(payload).length) {
    const { error: updErr } = await supabase.auth.updateUser(payload);
    if (updErr) return { ok: false, error: updErr.message };
  }

  // 3) Sync en tu tabla
  const updates: any = {};
  if (typeof input.email  !== 'undefined') updates.email  = input.email;
  if (typeof input.nombre !== 'undefined') updates.nombre = input.nombre;

  if (Object.keys(updates).length) {
    updates.updated_at = new Date().toISOString();
    const { error: pErr } = await supabase.from('tbl_usuarios')
      .update(updates)
      .eq('id', input.id);
    if (pErr) return { ok: false, error: pErr.message };
  }

  try {
    revalidatePath('/usuarios');
    revalidatePath(`/usuarios/${input.id}`);
  } catch {}

  return { ok: true };
}


// Asume que tienes un cliente `supabase` disponible en este scope
// (igual que en tu putCategoriasAction). Si no, impórtalo según tu proyecto.

export async function putUsuarioAction(
  id: string,
  nombre: string,
  apellido: string,
  phone?: string | null,
  id_perfil?: number
) {
  // Construimos el payload evitando sobreescribir campos si no vienen
  const payload: {
    nombre: string;
    apellido: string;
    phone?: string | null;
    id_perfil?: number;
    updated_at?: string;
  } = { nombre, apellido };

  if (typeof phone !== "undefined") {
    payload.phone = phone;
  }
  if (typeof id_perfil !== "undefined") {
    payload.id_perfil = Number(id_perfil);
  }

  // (Opcional) timestamp si tu tabla lo tiene
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("tbl_usuarios")
    .update(payload)
    .eq("id", id)
    .select("id,nombre,apellido,phone,email,id_perfil")
    .single(); // <- devolvemos una sola fila

  if (error) throw new Error(error.message);

  return data as {
    id: string;
    nombre: string;
    apellido: string;
    phone: string | null;
    email: string;       // solo lectura, no lo modificamos
    id_perfil: number;
  };
}
