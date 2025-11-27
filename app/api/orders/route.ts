import { createOrderAction, CreateOrderInput, getOrdersHeadAction } from "@/app/(admin)/ordenes/actions";
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
    const body = (await req.json().catch(() => ({}))) as Partial<CreateOrderInput> & {
      direccion?: {
        latitud?: number;
        longitud?: number;
        latitude?: number;
        longitude?: number;
        id_direccion?: number;
        nombre_direccion?: string;
        referencia?: string;
      };
      latitud?: number;
      longitud?: number;
    };

    console.log(`[${reqId}] POST /api/orders BODY:`, JSON.stringify(body, null, 2));

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

    // ========================
    // Resolver coordenadas
    // ========================
    const direccion = body.direccion ?? null;

    const latitud =
      body.latitud ??
      direccion?.latitud ??
      direccion?.latitude ??
      null;

    const longitud =
      body.longitud ??
      direccion?.longitud ??
      direccion?.longitude ??
      null;

    console.log(`[${reqId}] POST /api/orders COORDS RESUELTAS:`, { latitud, longitud });

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
      latitud,          // ⬅ ya viene de body.direccion.latitud si existe
      longitud,         // ⬅ ya viene de body.direccion.longitud si existe
      tipo_dispositivo: body.tipo_dispositivo ?? null,
      observacion: body.observacion ?? null,
      usuario_actualiza: body.usuario_actualiza ?? null,
      // Actividad
      actividad_observacion: body.actividad_observacion ?? null,
    } as CreateOrderInput);

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

export async function GET(req: Request) {
  const reqId = `ordhead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    // 🔥 UID obligatorio
    if (!uid || uid.trim() === "") {
      return NextResponse.json(
        {
          message: "Debe enviar el parámetro 'uid'.",
          reqId,
        },
        { status: 400 }
      );
    }

    const data = await getOrdersHeadAction(uid);

    return NextResponse.json(
      {
        message: "Órdenes obtenidas correctamente.",
        data,
        reqId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/orders/head error:`, err);
    const message =
      err?.message || String(err) || "Error inesperado obteniendo órdenes.";

    return NextResponse.json(
      {
        message,
        reqId,
      },
      { status: 500 }
    );
  }
}