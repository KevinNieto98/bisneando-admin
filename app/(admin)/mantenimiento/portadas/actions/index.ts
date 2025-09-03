'use server';
import { supabase } from "@/utils/supabase/client"; // ⬅️ IMPORTA SOLO EL CLIENTE

export async function postPortadaAction(
  file: File,
  link: string,
  is_active: boolean,
  usuario_crea = "ADMIN"
) {
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { data, error } = await supabase
    .from("tbl_portadas")
    .insert([{ imagen: bytes, link, is_active, usuario_crea }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as {
    id_portada: number;
    imagen: string;
    link: string;
    is_active: boolean;
    fecha_creacion: string;
    usuario_crea: string;
    fecha_modificacion: string | null;
    usuario_modificacion: string | null;
  };
}

export async function updatePortadaAction(
  id_portada: number,
  file: File | null | undefined,
  link: string,
  is_active: boolean,
  usuario_modificacion = "ADMIN"
) {
  const payload: any = {
    link,
    is_active,
    usuario_modificacion,
    fecha_modificacion: new Date().toISOString(),
  };

  if (file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    payload.imagen = bytes;
  }

  const { data, error } = await supabase
    .from("tbl_portadas")
    .update(payload)
    .eq("id_portada", id_portada)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as {
    id_portada: number;
    imagen?: string;
    link: string;
    is_active: boolean;
    fecha_creacion: string;
    usuario_crea: string;
    fecha_modificacion: string | null;
    usuario_modificacion: string | null;
  };
}



export async function getPortadaAction(id_portada: number) {
  const { data, error } = await supabase
    .from('tbl_portadas')
    .select(
      `
      id_portada,
      imagen,
      link,
      is_active,
      fecha_creacion,
      usuario_crea,
      fecha_modificacion,
      usuario_modificacion
      `
    )
    .eq('id_portada', id_portada)
    .single();

  if (error) throw new Error(error.message);

  return data as {
    id_portada: number;
    imagen: string;
    link: string;
    is_active: boolean;
    fecha_creacion: string;
    usuario_crea: string;
    fecha_modificacion: string | null;
    usuario_modificacion: string | null;
  };
}