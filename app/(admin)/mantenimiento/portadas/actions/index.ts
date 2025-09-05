'use server';
import { supabase } from "@/utils/supabase/client"; // cliente de Supabase (no service role)

// ==============================
// Config
// ==============================
const BUCKET = "portadas";           // <- nombre del bucket
const FOLDER = "portadas";           // <- subcarpeta dentro del bucket donde guardas (puedes cambiarla)
const TRASH_FOLDER = "__trash";      // <- carpeta temporal para delete-first

// ==============================
// Helpers
// ==============================
type PlainError = { name?: string; message: string; code?: unknown; hint?: unknown; details?: string | undefined };

function toPlainError(err: unknown): PlainError | undefined {
  if (!err) return undefined;
  if (typeof err === "string" || typeof err === "number") return { message: String(err) };
  if (err instanceof Error) return { name: err.name, message: err.message };
  try {
    const any = err as any;
    return {
      message: any?.message ?? any?.error ?? "Unknown error",
      code: any?.code ?? any?.statusCode ?? any?.status,
      hint: any?.hint,
      details: typeof any?.details === "string" ? any.details : undefined,
    };
  } catch {
    return { message: "Unknown error" };
  }
}

/**
 * Dado un publicUrl, devuelve la **object key** relativa al bucket, SIN el prefijo del bucket.
 * Ejemplo:
 *  publicUrl: https://xxxx.supabase.co/storage/v1/object/public/portadas/portadas/abc.png
 *  bucket:    "portadas"
 *  => retorna: "portadas/abc.png"   (no incluye "portadas/" inicial del bucket)
 */
function getObjectKeyFromPublicUrl(publicUrl: string | null | undefined, bucket = BUCKET): string | null {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    const marker = `/object/public/${bucket}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    const key = url.pathname.substring(idx + marker.length); // esto es la object key dentro del bucket
    return key || null;
  } catch {
    return null;
  }
}

// ==============================
// Tipos
// ==============================
type PortadaRow = {
  id_portada: number;
  url_imagen?: string | null;
  link: string;
  is_active: boolean;
  fecha_creacion: string;
  usuario_crea: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
};

type UpdatePortadaOk = { ok: true; data: PortadaRow };
type UpdatePortadaErr = {
  ok: false;
  code:
    | "FETCH_CURRENT_FAILED"
    | "NOT_FOUND"
    | "MOVE_OLD_FAILED"
    | "STORAGE_UPLOAD_FAILED"
    | "DB_UPDATE_FAILED"
    | "RESTORE_OLD_FAILED"
    | "ROLLBACK_NEW_IMAGE_FAILED"
    | "TRASH_DELETE_FAILED"
    | "UNKNOWN";
  message: string;
  details?: PlainError | Record<string, PlainError | undefined>;
};
export type UpdatePortadaResult = UpdatePortadaOk | UpdatePortadaErr;

// ==============================
// POST (crear)
// ==============================
export async function postPortadaAction(
  file: File,
  link: string,
  is_active: boolean,
  usuario_crea = "ADMIN"
) {
  // 1) Generar ruta única (object key) dentro del bucket
  const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : "";
  const fileName = `${crypto.randomUUID()}${ext}`;
  // Puedes guardar en subcarpeta FOLDER/..., o en raíz. Aquí usamos subcarpeta:
  const objectKey = `${FOLDER}/${fileName}`;

  // 2) Subir al bucket
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectKey, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error subiendo la imagen: ${uploadError.message}`);
  }

  // 3) URL público
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(uploadData!.path); // uploadData.path == objectKey

  // 4) Insert en DB
  const { data, error } = await supabase
    .from("tbl_portadas")
    .insert([{ url_imagen: publicUrl, link, is_active, usuario_crea }])
    .select()
    .single();

  // 5) Rollback si falla
  if (error) {
    await supabase.storage.from(BUCKET).remove([uploadData!.path]).catch(() => {});
    throw new Error(`Error insertando portada: ${error.message}`);
  }

  // 6) Retorno tipado
  return data as {
    id_portada: number;
    url_imagen: string; // URL público
    link: string;
    is_active: boolean;
    fecha_creacion: string;
    usuario_crea: string;
    fecha_modificacion: string | null;
    usuario_modificacion: string | null;
  };
}

// ==============================
// UPDATE (delete-first con rollback)
// ==============================
export async function updatePortadaAction(
  id_portada: number,
  file: File | null | undefined,
  link: string,
  is_active: boolean,
  usuario_modificacion = "ADMIN"
): Promise<UpdatePortadaResult> {
  // 1) Obtener registro actual
  const { data: current, error: fetchError } = await supabase
    .from("tbl_portadas")
    .select("url_imagen")
    .eq("id_portada", id_portada)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, code: "FETCH_CURRENT_FAILED", message: "Error obteniendo portada actual", details: toPlainError(fetchError) };
  }
  if (!current) {
    return { ok: false, code: "NOT_FOUND", message: "Portada no encontrada" };
  }

  const payload: any = {
    link,
    is_active,
    usuario_modificacion,
    fecha_modificacion: new Date().toISOString(),
  };

  // Rutas/keys
  const oldKey = getObjectKeyFromPublicUrl(current?.url_imagen, BUCKET); // <- object key correcta dentro del bucket
  const hadOld = Boolean(oldKey);
  let trashKey: string | null = null;
  let newUploadKey: string | null = null;

  // 2) Si hay nueva imagen: DELETE-FIRST (move a trash) con rollback
  if (file) {
    // 2.a) Mover anterior a TRASH (si existía)
    if (hadOld && oldKey) {
      const ts = new Date();
      const y = ts.getFullYear();
      const m = String(ts.getMonth() + 1).padStart(2, "0");
      const d = String(ts.getDate()).padStart(2, "0");
      const hh = String(ts.getHours()).padStart(2, "0");
      const mm = String(ts.getMinutes()).padStart(2, "0");
      const ss = String(ts.getSeconds()).padStart(2, "0");
      const baseName = oldKey.split("/").pop();
      trashKey = `${TRASH_FOLDER}/${y}${m}${d}/${hh}${mm}${ss}_${baseName}`;

      const { error: moveErr } = await supabase.storage.from(BUCKET).move(oldKey, trashKey);
      if (moveErr) {
        return { ok: false, code: "MOVE_OLD_FAILED", message: "No se pudo preparar la eliminación de la imagen anterior", details: toPlainError(moveErr) };
      }
    }

    // 2.b) Subir nueva
    const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : "";
    const fileName = `${crypto.randomUUID()}${ext}`;
    newUploadKey = `${FOLDER}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newUploadKey, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      // restaurar la anterior si la movimos
      if (trashKey) {
        const { error: restoreErr } = await supabase.storage.from(BUCKET).move(trashKey, oldKey!);
        if (restoreErr) {
          return {
            ok: false,
            code: "RESTORE_OLD_FAILED",
            message: "Falló la subida y no se pudo restaurar la imagen anterior",
            details: { uploadError: toPlainError(uploadError), restoreErr: toPlainError(restoreErr) },
          };
        }
      }
      return { ok: false, code: "STORAGE_UPLOAD_FAILED", message: "Error subiendo la nueva imagen", details: toPlainError(uploadError) };
    }

    newUploadKey = uploadData!.path; // por si supabase ajusta el path

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(newUploadKey);

    payload.url_imagen = publicUrl;
  }

  // 3) UPDATE en DB (sin representación → evita problema RLS con select)
  const { error: upErr } = await supabase
    .from("tbl_portadas")
    .update(payload)
    .eq("id_portada", id_portada);

  if (upErr) {
    // a) borrar nueva si existe
    if (newUploadKey) {
      await supabase.storage.from(BUCKET).remove([newUploadKey]).catch(() => {});
    }
    // b) restaurar vieja desde trash si existe
    if (trashKey) {
      const { error: restoreErr } = await supabase.storage.from(BUCKET).move(trashKey, oldKey!);
      if (restoreErr) {
        return {
          ok: false,
          code: "RESTORE_OLD_FAILED",
          message: "Falló el update y no se pudo restaurar la imagen anterior",
          details: { upErr: toPlainError(upErr), restoreErr: toPlainError(restoreErr) },
        };
      }
    }
    return { ok: false, code: "DB_UPDATE_FAILED", message: "Error actualizando la portada", details: toPlainError(upErr) };
  }

  // 4) UPDATE OK → eliminar definitivamente la imagen vieja en trash
  if (trashKey) {
    const { error: trashDelErr } = await supabase.storage.from(BUCKET).remove([trashKey]);
    if (trashDelErr) {
      // éxito con warning opcional; no rompemos
      // return { ok: false, code: "TRASH_DELETE_FAILED", message: "Actualizó, pero no se pudo eliminar la imagen anterior en trash", details: toPlainError(trashDelErr) };
    }
  }

  // 5) Intentar leer fila actualizada (si RLS lo permite); si no, devolver fallback
  let updatedRow: PortadaRow | null = null;
  const { data: selData } = await supabase
    .from("tbl_portadas")
    .select(`
      id_portada,
      url_imagen,
      link,
      is_active,
      fecha_creacion,
      usuario_crea,
      fecha_modificacion,
      usuario_modificacion
    `)
    .eq("id_portada", id_portada)
    .limit(1)
    .maybeSingle();

  if (selData) updatedRow = selData as PortadaRow;

  return {
    ok: true,
    data:
      updatedRow ??
      ({
        id_portada,
        url_imagen: payload.url_imagen ?? current.url_imagen ?? null,
        link,
        is_active,
        fecha_creacion: "",
        usuario_crea: "",
        fecha_modificacion: payload.fecha_modificacion,
        usuario_modificacion,
      } as PortadaRow),
  };
}

// ==============================
// GET (leer uno)
// ==============================
export async function getPortadaAction(id_portada: number) {
  const { data, error } = await supabase
    .from('tbl_portadas')
    .select(
      `
      id_portada,
      url_imagen,
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
    url_imagen: string | null;
    link: string;
    is_active: boolean;
    fecha_creacion: string;
    usuario_crea: string;
    fecha_modificacion: string | null;
    usuario_modificacion: string | null;
  };
}


// ==============================
// Tipos resultado (comparten el patrón con updatePortadaAction)
// ==============================
type GetAllPortadasOk = {
  ok: true;
  data: {
    id_portada: number;
    url_imagen: string | null;
    link: string;
    is_active: boolean;
    fecha_creacion: string;
    usuario_crea: string;
    fecha_modificacion: string | null;
    usuario_modificacion: string | null;
  }[];
};
type GetAllPortadasErr = {
  ok: false;
  code: "DB_LIST_FAILED" | "UNKNOWN";
  message: string;
  details?: ReturnType<typeof toPlainError>;
};
export type GetAllPortadasResult = GetAllPortadasOk | GetAllPortadasErr;

// ==============================
// GET ALL (todas las portadas) con manejo de errores + paginación opcional
// ==============================
// Usa los mismos helpers ya definidos arriba:
// - toPlainError(err)
// - (opcional) otras utilidades

export async function getAllPortadasAction(params?: {
  offset?: number;   // desplazamiento para paginar (por defecto 0)
  limit?: number;    // límite de filas (por defecto 100)
  onlyActive?: boolean; // si true, filtra is_active = true
  orderBy?: "fecha_creacion" | "id_portada"; // campo para ordenar
  ascending?: boolean; // orden asc/desc
}): Promise<GetAllPortadasResult> {
  try {
    const {
      offset = 0,
      limit = 100,
      onlyActive = false,
      orderBy = "fecha_creacion",
      ascending = false,
    } = params ?? {};

    let query = supabase
      .from("tbl_portadas")
      .select(
        `
        id_portada,
        url_imagen,
        link,
        is_active,
        fecha_creacion,
        usuario_crea,
        fecha_modificacion,
        usuario_modificacion
        `,
        { count: "exact", head: false }
      );

    if (onlyActive) {
      query = query.eq("is_active", true);
    }

    // Orden
    query = query.order(orderBy, { ascending });

    // Paginación (range es inclusivo, por eso offset+limit-1)
    const from = offset;
    const to = Math.max(offset + limit - 1, offset);
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      return {
        ok: false,
        code: "DB_LIST_FAILED",
        message: "Error obteniendo portadas",
        details: toPlainError(error),
      };
    }

    return {
      ok: true,
      data:
        (data as {
          id_portada: number;
          url_imagen: string | null;
          link: string;
          is_active: boolean;
          fecha_creacion: string;
          usuario_crea: string;
          fecha_modificacion: string | null;
          usuario_modificacion: string | null;
        }[]) ?? [],
    };
  } catch (err) {
    return {
      ok: false,
      code: "UNKNOWN",
      message: "Error inesperado obteniendo portadas",
      details: toPlainError(err),
    };
  }
}
