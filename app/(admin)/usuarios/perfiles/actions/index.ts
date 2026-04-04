import { supabase } from "@/utils/supabase/client";

export type PerfilRow = {
  id_perfil: number;
  nombre_perfil: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Perfil = {
  id_perfil: number;
  nombre_perfil: string;
  activo: boolean;
};

export async function getPerfilesAction(): Promise<Perfil[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    console.error("Faltan variables de entorno de Supabase");
    return [];
  }

  const url = `${base}/rest/v1/tbl_perfiles?select=id_perfil,nombre_perfil,is_active&order=id_perfil.asc`;

  const res = await fetch(url, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener perfiles:", res.status, await res.text());
    return [];
  }

  const rows: PerfilRow[] = await res.json();

  return rows.map((r) => ({
    id_perfil: r.id_perfil,
    nombre_perfil: r.nombre_perfil,
    activo: r.is_active,
  }));
}

export async function postPerfilAction(
  nombre_perfil: string,
  is_active: boolean
): Promise<PerfilRow> {
  console.log("[postPerfilAction] Payload enviado:", { nombre_perfil, is_active });

  const { data, error } = await supabase
    .from("tbl_perfiles")
    .insert([{ nombre_perfil, is_active }])
    .select("id_perfil,nombre_perfil,is_active")
    .single();

  if (error) {
    console.error("[postPerfilAction] Error completo:", JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }

  console.log("[postPerfilAction] Éxito:", JSON.stringify(data, null, 2));
  return data as PerfilRow;
}

export async function putPerfilAction(
  id: number,
  nombre_perfil: string,
  is_active: boolean
): Promise<PerfilRow> {
  const { data, error } = await supabase
    .from("tbl_perfiles")
    .update({ nombre_perfil, is_active })
    .eq("id_perfil", id)
    .select("id_perfil,nombre_perfil,is_active")
    .single();

  if (error) throw new Error(error.message);
  return data as PerfilRow;
}

export async function deletePerfilAction(id: number): Promise<void> {
  const { error } = await supabase
    .from("tbl_perfiles")
    .delete()
    .eq("id_perfil", id);

  if (error) throw new Error(error.message);
}
