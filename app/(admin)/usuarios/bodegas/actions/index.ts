import { supabase } from "@/utils/supabase/client";

// ── Tipos ──────────────────────────────────────────────────────────────────

export type BodegaRow = {
  id_bodega: number;
  nombre_bodega: string;
  is_active: boolean;
  direccion: string | null;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
};

export type Bodega = BodegaRow & {
  encargado: string | null;    // nombre completo calculado
  encargado_id: string | null; // UUID del usuario
};

/** Valor que maneja el formulario (sin id_bodega, con encargado_id) */
export type BodegaFormValue = Omit<BodegaRow, "id_bodega"> & {
  encargado_id: string | null;
};

export type UsuarioBodegaOpcion = {
  id: string;
  nombre: string;
  apellido: string;
  id_bodega: number | null;
};

export type LogBodega = {
  id_log: number;
  id_bodega: number | null;
  nombre_bodega: string | null;
  accion: string;
  descripcion: string | null;
  datos_antes: Record<string, unknown> | null;
  datos_despues: Record<string, unknown> | null;
  created_at: string;
};

// ── READ ───────────────────────────────────────────────────────────────────

export async function getBodegasAction(): Promise<BodegaRow[]> {
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !apiKey) return [];

  const res = await fetch(
    `${base}/rest/v1/tbl_bodegas?select=id_bodega,nombre_bodega,is_active,direccion,telefono,latitud,longitud&order=id_bodega.asc`,
    { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
  );

  if (!res.ok) { console.error("Error al obtener bodegas:", res.status, await res.text()); return []; }
  return res.json();
}

/** Todos los usuarios con id_perfil=3 (activos e inactivos) para cruzar encargado */
export async function getEncargadosBodegaAction(): Promise<UsuarioBodegaOpcion[]> {
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !apiKey) return [];

  const res = await fetch(
    `${base}/rest/v1/tbl_usuarios?select=id,nombre,apellido,id_bodega&id_perfil=eq.3&order=nombre.asc`,
    { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
  );

  if (!res.ok) return [];
  return res.json();
}

/** Solo usuarios ACTIVOS con id_perfil=3 → para el selector del modal */
export async function getUsuariosActivosBodegaAction(): Promise<UsuarioBodegaOpcion[]> {
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !apiKey) return [];

  const res = await fetch(
    `${base}/rest/v1/tbl_usuarios?select=id,nombre,apellido,id_bodega&id_perfil=eq.3&is_active=eq.true&order=nombre.asc`,
    { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
  );

  if (!res.ok) return [];
  return res.json();
}

export async function getLogsByBodegaIdAction(id_bodega: number): Promise<LogBodega[]> {
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !apiKey) return [];

  const res = await fetch(
    `${base}/rest/v1/tbl_bodegas_log?select=*&id_bodega=eq.${id_bodega}&order=created_at.desc&limit=100`,
    { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
  );

  if (!res.ok) { console.error("Error al obtener logs:", res.status, await res.text()); return []; }
  return res.json();
}

// ── BODEGA CRUD ────────────────────────────────────────────────────────────

export async function postBodegaAction(payload: Omit<BodegaRow, "id_bodega">): Promise<BodegaRow> {
  const { data, error } = await supabase
    .from("tbl_bodegas")
    .insert([payload])
    .select("id_bodega,nombre_bodega,is_active,direccion,telefono,latitud,longitud")
    .single();

  if (error) throw new Error(error.message);
  return data as BodegaRow;
}

export async function putBodegaAction(
  id: number,
  payload: Omit<BodegaRow, "id_bodega">
): Promise<BodegaRow> {
  const { data, error } = await supabase
    .from("tbl_bodegas")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id_bodega", id)
    .select("id_bodega,nombre_bodega,is_active,direccion,telefono,latitud,longitud")
    .single();

  if (error) throw new Error(error.message);
  return data as BodegaRow;
}

export async function deleteBodegaAction(id: number): Promise<void> {
  const { error } = await supabase.from("tbl_bodegas").delete().eq("id_bodega", id);
  if (error) throw new Error(error.message);
}

// ── USUARIO ENCARGADO ──────────────────────────────────────────────────────

/** Asigna o desasigna id_bodega a un usuario */
export async function asignarEncargadoAction(
  userId: string,
  id_bodega: number | null
): Promise<void> {
  const { error } = await supabase
    .from("tbl_usuarios")
    .update({ id_bodega, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

/** Desactiva al usuario encargado de la bodega */
export async function desactivarEncargadoAction(userId: string): Promise<void> {
  const { error } = await supabase
    .from("tbl_usuarios")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

// ── LOG DE AUDITORÍA ───────────────────────────────────────────────────────

type RegistrarLogInput = {
  id_bodega: number | null;
  nombre_bodega: string | null;
  accion: string;
  descripcion?: string;
  datos_antes?: Record<string, unknown> | null;
  datos_despues?: Record<string, unknown> | null;
};

export async function registrarLogBodegaAction(input: RegistrarLogInput): Promise<void> {
  const { error } = await supabase.from("tbl_bodegas_log").insert([{
    id_bodega:     input.id_bodega,
    nombre_bodega: input.nombre_bodega,
    accion:        input.accion,
    descripcion:   input.descripcion ?? null,
    datos_antes:   input.datos_antes ?? null,
    datos_despues: input.datos_despues ?? null,
  }]);

  // El log no debe interrumpir el flujo aunque falle
  if (error) console.error("Error al registrar log:", error.message);
}
