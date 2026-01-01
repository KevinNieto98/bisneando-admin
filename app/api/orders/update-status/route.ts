// app/api/orders/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusByIdAction } from "@/app/(admin)/ordenes/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/orders/update-status
 * Body:
 * {
 *   "id_order": 123,
 *   "id_status_destino": 6,
 *   "observacion": "Motivo...",
 *   "usuario_actualiza": "admin"
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

    // Ejecuta la acción
    const data = await updateOrderStatusByIdAction({
      id_order,
      id_status_destino,
      observacion,
      usuario_actualiza,
    });

    return NextResponse.json(
      { message: "Estado de la orden actualizado correctamente.", data, reqId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] POST /api/orders/update-status error:`, err);
    const message =
      err?.message ||
      String(err) ||
      "Error inesperado actualizando el estado de la orden.";
    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
