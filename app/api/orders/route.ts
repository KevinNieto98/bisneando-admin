import { createOrderAction, CreateOrderInput } from "@/app/(admin)/ordenes/actions";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================
   POST /api/orders
   Crea: head -> det[] -> activity
   ============================ */
export async function POST(req: Request) {
  const reqId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<CreateOrderInput>;

    // Validaciones mínimas
    if (!body?.id_status || !Array.isArray(body.items) || body.items.length === 0) {
      console.error(`[${reqId}] POST /api/orders -> body inválido`, body);
      return NextResponse.json(
        { message: "id_status e items son requeridos, y items no puede estar vacío.", reqId },
        { status: 400 }
      );
    }

    // Normalización de items (número seguro)
    const items = body.items.map((it: any) => ({
      id_producto: Number(it.id_producto),
      qty: Number(it.qty),
      precio: Number(it.precio),
      id_bodega: it.id_bodega == null ? null : Number(it.id_bodega),
    }));

    // Reglas básicas
    if (items.some((i) => !Number.isFinite(i.id_producto) || i.id_producto <= 0)) {
      return NextResponse.json(
        { message: "Cada item debe tener id_producto numérico y > 0.", reqId },
        { status: 400 }
      );
    }
    if (items.some((i) => !Number.isFinite(i.qty) || i.qty <= 0)) {
      return NextResponse.json(
        { message: "Cada item debe tener qty numérico y > 0.", reqId },
        { status: 400 }
      );
    }
    if (items.some((i) => !Number.isFinite(i.precio) || i.precio < 0)) {
      return NextResponse.json(
        { message: "Cada item debe tener precio numérico y ≥ 0.", reqId },
        { status: 400 }
      );
    }

    // Llamar a la Server Action (Supabase)
    const result = await createOrderAction({
      id_status: Number(body.id_status),
      items,
      // Opcionales de header
      uid: body.uid ?? undefined,
      delivery: body.delivery ?? 0,
      isv: body.isv ?? 0,
      ajuste: body.ajuste ?? 0,
      num_factura: body.num_factura ?? null,
      rtn: body.rtn ?? null,
      latitud: body.latitud ?? null,
      longitud: body.longitud ?? null,
      tipo_dispositivo: body.tipo_dispositivo ?? null,
      observacion: body.observacion ?? null,
      usuario_actualiza: body.usuario_actualiza ?? null,
      // Actividad
      actividad_observacion: body.actividad_observacion ?? null,
    });

    return NextResponse.json(
      { message: "Orden creada correctamente.", data: result, reqId },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] POST /api/orders error:`, err);
    const message = err?.message || String(err) || "Error inesperado creando la orden.";
    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
