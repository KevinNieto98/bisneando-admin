import { getFulfillmentByOrderIdAndStatusAction } from "@/app/(admin)/ordenes/actions";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/orders/fulfillment/by-order?id_order=123&id_status=2
 * - id_order: requerido
 * - id_status: opcional
 *
 * Responde con lo que retorne la action getFulfillmentByOrderIdAndStatusAction().
 */
export async function GET(req: NextRequest) {
  const reqId = `ord_ful_byord_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  try {
    const { searchParams } = new URL(req.url);

    const id_order_raw = searchParams.get("id_order");
    const id_status_raw = searchParams.get("id_status");

    // Validación id_order
    const id_order = Number(id_order_raw);
    if (!id_order_raw || !Number.isFinite(id_order) || id_order <= 0) {
      return NextResponse.json(
        { message: "Debe enviar un id_order válido (> 0).", reqId },
        { status: 400 }
      );
    }

    // Validación id_status (opcional)
    let id_status: number | null | undefined = undefined;
    if (id_status_raw != null && id_status_raw !== "") {
      const parsed = Number(id_status_raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { message: "Si envías id_status, debe ser válido (> 0).", reqId },
          { status: 400 }
        );
      }
      id_status = parsed;
    } else {
      // si viene vacío o no viene, lo mandamos como null/undefined según tu gusto
      id_status = null;
    }

    // Llamada a tu action (la action decide qué columnas y filtros aplica)
    const data = await getFulfillmentByOrderIdAndStatusAction(id_order, id_status);

    return NextResponse.json(
      {
        message: "OK",
        data,
        reqId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/orders/fulfillment/by-order error:`, err);
    return NextResponse.json(
      {
        message:
          err?.message ||
          String(err) ||
          "Error inesperado obteniendo fulfillments por orden.",
        reqId,
      },
      { status: 500 }
    );
  }
}
