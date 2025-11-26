// app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { getOrderByIdAction } from "@/app/(admin)/ordenes/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:id
 * Devuelve head + det + activity enriquecidos para una orden específica.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const reqId = `ordbyid_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  try {
    const rawId = params.id;
    const id_order = Number(rawId);

    // Validación básica
    if (!rawId || !Number.isFinite(id_order) || id_order <= 0) {
      return NextResponse.json(
        {
          message: "Debe enviar un id de orden válido en la URL.",
          reqId,
        },
        { status: 400 }
      );
    }

    // Llamamos a tu server action
    const data = await getOrderByIdAction(id_order);

    if (!data) {
      // getOrderByIdAction devuelve null si no hay fila (PGRST116)
      return NextResponse.json(
        {
          message: `No se encontró la orden con id ${id_order}.`,
          reqId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Orden obtenida correctamente.",
        data, // { head, det, activity }
        reqId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/orders/:id error:`, err);
    const message =
      err?.message || String(err) || "Error inesperado obteniendo la orden.";

    return NextResponse.json(
      {
        message,
        reqId,
      },
      { status: 500 }
    );
  }
}
