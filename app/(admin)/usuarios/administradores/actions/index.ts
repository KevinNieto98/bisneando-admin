import { supabase } from "@/utils/supabase/client";

export type UsuarioAdmin = {
  id: string;
  nombre: string;
  apellido: string;
  phone: string | null;
  email: string;
  is_active: boolean;
};

/** Administradores actuales (id_perfil = 2) */
export async function getAdministradoresAction(): Promise<UsuarioAdmin[]> {
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !apiKey) return [];

  const res = await fetch(
    `${base}/rest/v1/tbl_usuarios?select=id,nombre,apellido,phone,email,is_active&id_perfil=eq.2&order=nombre.asc`,
    { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
  );

  if (!res.ok) return [];
  return res.json();
}

/** Usuarios activos que NO son administradores (id_perfil != 2) — para el selector */
export async function getUsuariosNoAdminActivosAction(): Promise<UsuarioAdmin[]> {
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !apiKey) return [];

  const res = await fetch(
    `${base}/rest/v1/tbl_usuarios?select=id,nombre,apellido,phone,email,is_active&id_perfil=neq.2&is_active=eq.true&order=nombre.asc`,
    { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
  );

  if (!res.ok) return [];
  return res.json();
}

/** Asigna perfil administrador (id_perfil = 2) */
export async function asignarAdminAction(userId: string): Promise<void> {
  const { error } = await supabase
    .from("tbl_usuarios")
    .update({ id_perfil: 2, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

/** Retira perfil administrador → vuelve a cliente (id_perfil = 1) */
export async function retirarAdminAction(userId: string): Promise<void> {
  const { error } = await supabase
    .from("tbl_usuarios")
    .update({ id_perfil: 1, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
