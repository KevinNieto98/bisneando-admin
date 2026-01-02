import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusByIdAction } from "@/app/(admin)/ordenes/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/orders/update-status
 * Body:
 * {
 *   "id_order": 123,
 *   "id_status_destino": 3,
 *   "id_bodega": 2,              // 🆕 OPCIONAL
 *   "observacion": "Comentario",
 *   "usuario_actualiza": "Bodega 2"
 * }
 */
export async function POST(req: NextRequest) {
  const reqId = `ord_updst_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  try {
    const body = await req.json().catch(() => null);

    const id_order = Number(body?.id_order);
    const id_status_destino = Number(body?.id_status_destino);

    // 🆕 id_bodega OPCIONAL
    const id_bodega_raw = body?.id_bodega;
    const id_bodega =
      id_bodega_raw === undefined || id_bodega_raw === null
        ? undefined
        : Number(id_bodega_raw);

    const observacionRaw = body?.observacion;
    const usuarioRaw = body?.usuario_actualiza;

    const observacion =
      observacionRaw === undefined || observacionRaw === null
        ? null
        : String(observacionRaw);

    const usuario_actualiza =
      usuarioRaw === undefined || usuarioRaw === null
        ? null
        : String(usuarioRaw);

    // =========================
    // Validaciones básicas
    // =========================
    if (!Number.isFinite(id_order) || id_order <= 0) {
      return NextResponse.json(
        { message: "Debe enviar un id_order válido (> 0).", reqId },
        { status: 400 }
      );
    }

    if (!Number.isFinite(id_status_destino) || id_status_destino <= 0) {
      return NextResponse.json(
        { message: "Debe enviar un id_status_destino válido (> 0).", reqId },
        { status: 400 }
      );
    }

    // id_bodega es opcional, pero si viene debe ser válido
    if (
      id_bodega !== undefined &&
      (!Number.isFinite(id_bodega) || id_bodega <= 0)
    ) {
      return NextResponse.json(
        {
          message:
            "Si se envía id_bodega, debe ser un número válido mayor a 0.",
          reqId,
        },
        { status: 400 }
      );
    }

    // =========================
    // Ejecutar acción
    // (la lógica de negocio vive allí)
    // =========================
    const data = await updateOrderStatusByIdAction({
      id_order,
      id_status_destino,
      id_bodega, // 🆕 se pasa opcional
      observacion,
      usuario_actualiza,
    });

    return NextResponse.json(
      {
        message: "Estado de la orden procesado correctamente.",
        data,
        reqId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] POST /api/orders/update-status error:`, err);

    const message =
      err?.message ||
      String(err) ||
      "Error inesperado actualizando el estado de la orden.";

    return NextResponse.json(
      { message, reqId },
      { status: 500 }
    );
  }
}
