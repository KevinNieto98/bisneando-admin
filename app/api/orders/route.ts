import { createOrderAction, CreateOrderInput, getOrdersHeadAction } from "@/app/(admin)/ordenes/actions";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// 👇 Puedes cambiar este correo por el del admin
const ADMIN_EMAIL = "nieto.kevin98@gmail.com";

// helper opcional para formatear el código de la orden
function formatOrderCode(id: number, width = 5, prefix = "ORD-") {
  if (!Number.isFinite(id) || id <= 0) return `${prefix}00000`;
  return `${prefix}${String(id).padStart(width, "0")}`;
}

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
        id_colonia?: number | string | null;
      };
      latitud?: number;
      longitud?: number;
      id_metodo?: number | string | null;
      instrucciones_entrega?: string | null;
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
    // Resolver coordenadas y extras
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

    // 👇 aseguramos que sean numéricos o null
    const id_metodo =
      body.id_metodo != null && body.id_metodo !== ""
        ? Number(body.id_metodo)
        : null;

    const id_colonia =
      direccion?.id_colonia != null && direccion.id_colonia !== ""
        ? Number(direccion.id_colonia)
        : null;

    // 👇 observación que se guardará en tbl_orders_head.observacion
    const rawObs = typeof body.observacion === "string" ? body.observacion.trim() : "";
    const rawInstr =
      typeof body.instrucciones_entrega === "string"
        ? body.instrucciones_entrega.trim()
        : "";

    const observacion =
      rawObs.length > 0
        ? rawObs
        : rawInstr.length > 0
        ? rawInstr
        : null;

    console.log(
      `[${reqId}] POST /api/orders RESUELTO:`,
      { latitud, longitud, id_metodo, id_colonia, observacion }
    );

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
      latitud,
      longitud,
      tipo_dispositivo: body.tipo_dispositivo ?? null,
      observacion, // 👈 termina en tbl_orders_head.observacion
      usuario_actualiza: body.usuario_actualiza ?? null,
      // Actividad
      actividad_observacion: body.actividad_observacion ?? null,

      // extras para header
      id_metodo,
      id_colonia,
    } as CreateOrderInput & { id_metodo?: number | null; id_colonia?: number | null });

    // ========================
    // Enviar correo al admin
    // ========================
    try {
      const idOrder = result.id_order;
      if (idOrder) {
        const orderCode = formatOrderCode(idOrder);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const orderUrl = `${baseUrl}/ordenes/${idOrder}`;

        const { error } = await resend.emails.send({
          from: "nieto.onboarding@resend.dev", // usa tu dominio verificado en prod
          to: ADMIN_EMAIL, // mismo destinatario fijo (admin)
          subject: `Nueva orden generada ${orderCode}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px;">
              <h2 style="color:#111827;">Se ha generado una nueva orden</h2>
              <p>Se creó una nueva orden en el sistema.</p>

              <p style="margin:16px 0;">
                <strong>ID interno:</strong> ${idOrder}<br/>
                <strong>Código:</strong> ${orderCode}
              </p>

              <p style="margin:16px 0;">
                Puedes ver más detalles en el panel de administración:
              </p>

              <p style="margin:16px 0;text-align:center;">
                <a href="${orderUrl}" style="display:inline-block;padding:10px 18px;background:#111827;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;">
                  Ver orden
                </a>
              </p>

              <p style="font-size:12px;color:#6b7280;margin-top:24px;">
                Si no reconoces este correo, puedes ignorarlo.
              </p>
            </div>
          `,
        });

        if (error) {
          console.error(`[${reqId}] Error enviando correo de nueva orden:`, error);
        } else {
          console.log(`[${reqId}] Correo de nueva orden enviado a ${ADMIN_EMAIL}`);
        }
      } else {
        console.warn(`[${reqId}] No se envió correo: id_order nulo en resultado.`);
      }
    } catch (mailErr) {
      // No rompemos la creación de la orden si falla el correo
      console.error(`[${reqId}] Error inesperado enviando correo de nueva orden:`, mailErr);
    }

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

/* ============================
   GET /api/orders
   ============================ */
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
