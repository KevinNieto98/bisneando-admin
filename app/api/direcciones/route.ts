// app/api/direcciones/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { deleteDireccionAction, postDireccionAction, putDireccionAction } from "@/app/(admin)/colonias/actions";
// ⬇️ importa tu acción de lectura (ajusta la ruta si la tienes en otro archivo)
import { getDireccionesByUidAction } from "@/app/(admin)/colonias/actions";

/* ============================
   GET /api/direcciones?uid=...&limit=..&offset=..&principalOnly=true|false
   ============================ */
export async function GET(req: Request) {
  const reqId = `dir_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    const principalOnly = url.searchParams.get("principalOnly");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    if (!uid) {
      console.error(`[${reqId}] GET /api/direcciones -> uid faltante`);
      return NextResponse.json({ message: "uid es requerido." }, { status: 400 });
    }

    const limit = limitParam ? Number(limitParam) : undefined;
    const offset = offsetParam ? Number(offsetParam) : undefined;
    const onlyPrincipal = principalOnly === "true";

    // Llama a tu acción que trae las direcciones por uid (PostgREST)
    let direcciones = await getDireccionesByUidAction(uid);

    // Filtro opcional por principal
    if (onlyPrincipal) {
      direcciones = direcciones.filter((d) => d.isPrincipal);
    }

    // Paginación opcional en memoria (si tu acción no la soporta aún por QS)
    const sliced =
      typeof limit === "number"
        ? direcciones.slice(offset ?? 0, (offset ?? 0) + limit)
        : direcciones;

    return NextResponse.json(sliced, { status: 200 });
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/direcciones error:`, err);
    const message = err?.message || String(err) || "Error al obtener direcciones.";
    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}

/* ============================
   POST /api/direcciones
   (tu handler existente)
   ============================ */
export async function POST(req: Request) {
  // request id para correlacionar logs
  const reqId = `dir_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  try {
    const body = await req.json().catch(() => ({}));
    
    const {
      uid,
      latitude,
      longitude,
      tipo_direccion , // valor por defecto
      id_colonia = null,
      nombre_direccion = null,
      isPrincipal: isPrincipalReq = false,  // del body (camelCase)
      referencia = null,
      enforceSinglePrincipal = true,
    } = body ?? {};

    // Validaciones mínimas
    if (!uid || typeof uid !== "string") {
      console.error(`[${reqId}] Invalid uid`, { uidType: typeof uid, uid });
      return NextResponse.json(
        { message: "uid es requerido y debe ser string." },
        { status: 400 }
      );
    }
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      console.error(`[${reqId}] Invalid coords`, { latitude, longitude });
      return NextResponse.json(
        { message: "latitude y longitude son requeridos y deben ser numéricos." },
        { status: 400 }
      );
    }

    // 1) ¿Cuántas direcciones existentes hay para este uid?
    const { count, error: countErr } = await supabase
      .from("tbl_direcciones")
      .select("id_direccion", { count: "exact", head: true })
      .eq("uid", uid);

    if (countErr) {
      console.error(`[${reqId}] Count error:`, countErr);
      return NextResponse.json(
        { message: "No se pudo verificar direcciones existentes.", details: countErr.message },
        { status: 500 }
      );
    }

    // 2) Si es la PRIMERA dirección, que sea principal sí o sí
    const willBePrincipal = (count ?? 0) === 0 ? true : Boolean(isPrincipalReq);
    

    // 3) Si será principal y queremos forzar unicidad: desmarcar otras (si count=0, no hará updates)
    if (enforceSinglePrincipal && willBePrincipal) {
      
      const { data: upData, error: upErr } = await supabase
        .from("tbl_direcciones")
        .update({ isprincipal: false }) // ⚠️ columna en minúsculas
        .eq("uid", uid)
        .select("id_direccion"); // para loguear qué tocó (aunque puede ser array vacío)

    
      if (upErr) {
        console.error(`[${reqId}] Unset error:`, upErr);
        return NextResponse.json(
          {
            message: "No se pudo desmarcar direcciones principales previas.",
            details: upErr.message,
          },
          { status: 500 }
        );
      }
    }

    const nueva = await postDireccionAction({
      uid,
      latitude: latNum,
      longitude: lngNum,
      id_colonia,
      nombre_direccion,
      isPrincipal: willBePrincipal, // la action lo mapeará a isprincipal
      referencia,
      tipo_direccion
    });

    return NextResponse.json(nueva, { status: 201 });
  } catch (err: any) {
    console.error(`[${reqId}] POST /api/direcciones error:`, err);
    const message = err?.message || String(err) || "Error inesperado creando la dirección.";
    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  const reqId = `dir_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const t0 = Date.now();

  try {
    const url = new URL(req.url);
    const idFromQuery = url.searchParams.get("id");
    const body = await req.json().catch(() => ({} as any));
    const idFromBody = body?.id;

    const idParam = Number(idFromQuery ?? idFromBody);


    if (!Number.isFinite(idParam)) {
      console.error(`[${reqId}] id inválido`, { idFromQuery, idFromBody });
      return NextResponse.json(
        { message: "id es requerido y debe ser numérico.", reqId },
        { status: 400 }
      );
    }

    try {
      const deletedId = await deleteDireccionAction(idParam);
     
    } catch (delErr: any) {
      console.error(`[${reqId}] deleteDireccionAction ERROR`, {
        message: delErr?.message,
        stack: delErr?.stack,
      });
      return NextResponse.json(
        { message: "No se pudo eliminar la dirección.", details: delErr?.message, reqId },
        { status: 500 }
      );
    }

   
    return NextResponse.json(
      { message: "Dirección eliminada.", deletedId: idParam, reqId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] FATAL`, { message: err?.message, stack: err?.stack, durationMs: Date.now() - t0 });
    return NextResponse.json(
      { message: err?.message ?? "Error al eliminar dirección.", reqId },
      { status: 500 }
    );
  }
}

/* ============================
   PUT /api/direcciones
   (actualiza por id_direccion)
   ============================ */
export async function PUT(req: Request) {
  const reqId = `dir_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const url = new URL(req.url);
    const idFromQuery = url.searchParams.get("id"); // opcional (también se acepta en body)
    const body = await req.json().catch(() => ({} as any));

    // id puede venir por query ?id= o en el body como id_direccion
    const idParam = Number(idFromQuery ?? body?.id_direccion);
    if (!Number.isFinite(idParam) || idParam <= 0) {
      console.error(`[${reqId}] PUT /api/direcciones -> id inválido`, {
        idFromQuery,
        idFromBody: body?.id_direccion,
      });
      return NextResponse.json(
        { message: "id_direccion es requerido y debe ser numérico.", reqId },
        { status: 400 }
      );
    }

    // Campos opcionales (solo se actualizan los que vengan definidos)
    const updates: {
      id_direccion: number;
      nombre_direccion?: string | null;
      latitude?: number;
      longitude?: number;
      referencia?: string | null;
      tipo_direccion?: number;
      id_colonia?: number | null;
    } = { id_direccion: idParam };

    // nombre_direccion
    if ("nombre_direccion" in body) {
      updates.nombre_direccion = body.nombre_direccion ?? null;
    }

    // referencia
    if ("referencia" in body) {
      updates.referencia = body.referencia ?? null;
    }

    // tipo_direccion
    if ("tipo_direccion" in body) {
      const t = Number(body.tipo_direccion);
      if (!Number.isFinite(t)) {
        return NextResponse.json(
          { message: "tipo_direccion debe ser numérico.", reqId },
          { status: 400 }
        );
      }
      updates.tipo_direccion = t;
    }

    // id_colonia (puede ser null)
    if ("id_colonia" in body) {
      if (body.id_colonia === null) {
        updates.id_colonia = null;
      } else {
        const c = Number(body.id_colonia);
        if (!Number.isFinite(c)) {
          return NextResponse.json(
            { message: "id_colonia debe ser numérico o null.", reqId },
            { status: 400 }
          );
        }
        updates.id_colonia = c;
      }
    }

    // latitude / longitude (si llegan, deben ser numéricas)
    if ("latitude" in body) {
      const lat = Number(body.latitude);
      if (!Number.isFinite(lat)) {
        return NextResponse.json(
          { message: "latitude debe ser numérica.", reqId },
          { status: 400 }
        );
      }
      updates.latitude = lat;
    }

    if ("longitude" in body) {
      const lng = Number(body.longitude);
      if (!Number.isFinite(lng)) {
        return NextResponse.json(
          { message: "longitude debe ser numérica.", reqId },
          { status: 400 }
        );
      }
      updates.longitude = lng;
    }

    // Evita actualizar si no hay ningún campo opcional presente
    const fieldsToUpdate = { ...updates };
    delete (fieldsToUpdate as any).id_direccion;
    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json(
        { message: "No se enviaron campos para actualizar.", reqId },
        { status: 400 }
      );
    }

    // Llama a la acción (formatea decimales y solo envía lo definido)
    const updated = await putDireccionAction(updates);

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error(`[${reqId}] PUT /api/direcciones error:`, err);
    const message = err?.message || String(err) || "Error al actualizar la dirección.";
    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}

/* ============================
   PATCH /api/direcciones
   (alias a PUT)
   ============================ */
export async function PATCH(req: Request) {
  return PUT(req);
}
