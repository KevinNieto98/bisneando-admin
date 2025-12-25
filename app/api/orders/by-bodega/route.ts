// app/api/orders/by-bodega/route.ts
import { NextResponse } from "next/server";
import { getOrdersHeadByBodegaAction } from "@/app/(admin)/ordenes/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================
   GET /api/orders/by-bodega?id_bodega=#
   ============================ */
export async function GET(req: Request) {
  const reqId = `ord_bod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { searchParams } = new URL(req.url);
    const idBodegaRaw = searchParams.get("id_bodega");

    // id_bodega obligatorio
    if (!idBodegaRaw || idBodegaRaw.trim() === "") {
      return NextResponse.json(
        { message: "Debe enviar el parámetro 'id_bodega'.", reqId },
        { status: 400 }
      );
    }

    const id_bodega = Number(idBodegaRaw);

    if (!Number.isFinite(id_bodega) || id_bodega <= 0) {
      return NextResponse.json(
        { message: "El parámetro 'id_bodega' debe ser numérico y > 0.", reqId },
        { status: 400 }
      );
    }

    const data = await getOrdersHeadByBodegaAction(id_bodega);

    return NextResponse.json(
      { message: "Órdenes por bodega obtenidas correctamente.", data, reqId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/orders/by-bodega error:`, err);
    const message =
      err?.message || String(err) || "Error inesperado obteniendo órdenes por bodega.";

    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
