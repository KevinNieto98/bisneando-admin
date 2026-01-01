import { NextRequest, NextResponse } from "next/server";
import { getActivityOrdersByOrderIdAction } from "@/app/(admin)/ordenes/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/activityOrder/:id
 * Devuelve el historial de actividades de una orden (id_order),
 * ordenado por id_act DESC.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = `actord_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  try {
    const { id: rawId } = await params;
    const id_order = Number(rawId);

    if (!rawId || !Number.isFinite(id_order) || id_order <= 0) {
      return NextResponse.json(
        {
          message: "Debe enviar un id de orden válido en la URL.",
          reqId,
        },
        { status: 400 }
      );
    }

    const data = await getActivityOrdersByOrderIdAction(id_order);

    return NextResponse.json(
      {
        message: "Actividad de la orden obtenida correctamente.",
        data,
        reqId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/activityOrder/:id error:`, err);

    const message =
      err?.message ||
      String(err) ||
      "Error inesperado obteniendo la actividad de la orden.";

    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
