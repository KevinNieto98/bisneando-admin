// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOrderByIdAction } from "@/app/(admin)/ordenes/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:id?id_bodega=123
 * Devuelve head + det + activity enriquecidos para una orden específica,
 * opcionalmente filtrada por bodega.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = `ordbyid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { id: rawId } = await params;
    const id_order = Number(rawId);

    if (!rawId || !Number.isFinite(id_order) || id_order <= 0) {
      return NextResponse.json(
        { message: "Debe enviar un id de orden válido en la URL.", reqId },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawBodega = searchParams.get("id_bodega");

    const id_bodega =
      rawBodega === null || rawBodega.trim() === ""
        ? undefined
        : Number(rawBodega);

    if (id_bodega !== undefined && (!Number.isFinite(id_bodega) || id_bodega <= 0)) {
      return NextResponse.json(
        { message: "Si envía id_bodega, debe ser un número válido (> 0).", reqId },
        { status: 400 }
      );
    }

    // Pasa el filtro opcional a tu action
    const data = await getOrderByIdAction(id_order, id_bodega);

    if (!data) {
      return NextResponse.json(
        { message: `No se encontró la orden con id ${id_order}.`, reqId },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Orden obtenida correctamente.", data, reqId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/orders/:id error:`, err);
    const message = err?.message || String(err) || "Error inesperado obteniendo la orden.";
    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
