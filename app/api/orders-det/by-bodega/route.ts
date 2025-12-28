// app/api/orders-det/by-bodega/route.ts
import { NextResponse } from "next/server";
import { getOrdersDetByBodegaAction } from "@/app/(admin)/ordenes/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================
   GET /api/orders-det/by-bodega?id_bodega=#(&id_order=# opcional)
   ============================ */
export async function GET(req: Request) {
  const reqId = `ord_det_bod_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  try {
    const { searchParams } = new URL(req.url);

    const idBodegaRaw = searchParams.get("id_bodega");
    const idOrderRaw = searchParams.get("id_order"); // opcional

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

    // id_order opcional
    let id_order: number | undefined = undefined;
    if (idOrderRaw && idOrderRaw.trim() !== "") {
      const parsed = Number(idOrderRaw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { message: "El parámetro 'id_order' debe ser numérico y > 0.", reqId },
          { status: 400 }
        );
      }
      id_order = parsed;
    }

    // Traer detalle por bodega
    const data = await getOrdersDetByBodegaAction(id_bodega);

    // Filtro adicional por id_order (si lo mandan)
    const filtered = id_order ? data.filter((r) => r.id_order === id_order) : data;

    return NextResponse.json(
      {
        message: "Detalle de órdenes por bodega obtenido correctamente.",
        data: filtered,
        reqId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/orders-det/by-bodega error:`, err);

    const message =
      err?.message ||
      String(err) ||
      "Error inesperado obteniendo detalle de órdenes por bodega.";

    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
