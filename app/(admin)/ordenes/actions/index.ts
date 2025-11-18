"use server";

import { supabase } from "@/utils/supabase/client";

export type OrderDetailInput = {
  id_producto: number;
  qty: number;
  precio: number;
  id_bodega?: number | null;
};

export type CreateOrderInput = {
  id_status: number;
  items: OrderDetailInput[];

  uid?: string;
  delivery?: number;
  isv?: number;
  ajuste?: number;
  num_factura?: string | null;
  rtn?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  tipo_dispositivo?: string | null;
  observacion?: string | null;
  usuario_actualiza?: string | null;

  actividad_observacion?: string | null;
};

export type CreateOrderResult = {
  id_order: number;
  det_count: number;
  id_act?: number;
};

/* ===== Helpers ===== */
function computeTotals(
  items: OrderDetailInput[],
  isv = 0,
  delivery = 0,
  ajuste = 0
) {
  const sub_total = items.reduce((acc, it) => acc + it.qty * it.precio, 0);
  const qty = items.reduce((acc, it) => acc + it.qty, 0);
  const total = sub_total + (isv ?? 0) + (delivery ?? 0) + (ajuste ?? 0);
  return { sub_total, qty, total };
}

function genUUID(): string {
  try {
    // @ts-ignore
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return "uid_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Agrupa por producto por si vienen líneas repetidas del mismo id_producto */
function compactItems(items: OrderDetailInput[]) {
  const map = new Map<number, number>();
  for (const it of items) {
    map.set(it.id_producto, (map.get(it.id_producto) ?? 0) + Number(it.qty));
  }
  return Array.from(map.entries()).map(([id_producto, qty]) => ({ id_producto, qty }));
}

/* =========================================================================
   Acción: inserta orden + descuenta stock con RPC
   ========================================================================= */
export async function createOrderAction(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("La orden debe contener al menos un renglón en 'items'.");
  }

  const delivery = input.delivery ?? 0;
  const isv = input.isv ?? 0;
  const ajuste = input.ajuste ?? 0;
  const { sub_total, qty, total } = computeTotals(input.items, isv, delivery, ajuste);
  const uid = input.uid && input.uid.trim().length > 0 ? input.uid : genUUID();

  let id_order: number | null = null;
  let detInserted = false;
  let id_act: number | undefined;
  let stockAdjusted = false; // para saber si revertir stock en catch

  try {
    /* 1) Header -> tbl_orders_head */
    const headerRow = {
      uid,
      id_status: input.id_status,
      id_max_log: null,
      qty,
      sub_total,
      isv,
      delivery,
      ajuste,
      total,
      num_factura: input.num_factura ?? null,
      rtn: input.rtn ?? null,
      latitud: input.latitud ?? null,
      longitud: input.longitud ?? null,
      tipo_dispositivo: input.tipo_dispositivo ?? null,
      observacion: input.observacion ?? null,
      usuario_actualiza: input.usuario_actualiza ?? null,
    };

    const { data: head, error: headErr } = await supabase
      .from("tbl_orders_head")
      .insert([headerRow])
      .select("id_order")
      .single();

    if (headErr) throw new Error(headErr.message);
    id_order = head?.id_order;
    if (!id_order) throw new Error("No se obtuvo id_order del insert del header.");

    /* 2) Detalle (batch) -> tbl_orders_det */
    const detRows = input.items.map((it) => ({
      id_order,
      id_producto: it.id_producto,
      qty: it.qty,
      precio: it.precio,
      id_bodega: it.id_bodega ?? null,
      // sub_total es columna generada; NO se envía
    }));

    const { data: detData, error: detErr } = await supabase
      .from("tbl_orders_det")
      .insert(detRows)
      .select("id_det");

    if (detErr) throw new Error(detErr.message);
    detInserted = true;
    const det_count = detData?.length ?? 0;

    /* 3) Descuento de stock (ATÓMICO en DB vía RPC) */
    // Agrupar cantidades por producto:
    const itemsComp = compactItems(input.items);

    // 👉 Llama el RPC que descuenta stock validando que alcance (ver SQL abajo)
    const { data: decOk, error: decErr } = await supabase.rpc(
      "rpc_adjust_stock", // nombre del RPC recomendado
      { p_items: itemsComp, p_sign: -1 } // -1 = restar, +1 = sumar
    );

    if (decErr) throw new Error(decErr.message);
    if (!decOk) throw new Error("No fue posible descontar el stock.");
    stockAdjusted = true;

    /* 4) Actividad inicial -> tbl_activity_orders */
    const actividadRow = {
      id_order,
      id_status: input.id_status,
      usuario_actualiza: input.usuario_actualiza ?? null,
      observacion: input.actividad_observacion ?? input.observacion ?? null,
    };

    const { data: actData, error: actErr } = await supabase
      .from("tbl_activity_orders")
      .insert([actividadRow])
      .select("id_act")
      .single();

    if (actErr) throw new Error(actErr.message);
    id_act = actData?.id_act;

    return { id_order, det_count, id_act };
  } catch (e: any) {
    // Rollback manual de inserts
    try {
      if (id_order) {
        await supabase.from("tbl_activity_orders").delete().eq("id_order", id_order);
        if (detInserted) {
          await supabase.from("tbl_orders_det").delete().eq("id_order", id_order);
        }
        await supabase.from("tbl_orders_head").delete().eq("id_order", id_order);
      }
    } finally {
      // Si ya habíamos descontado stock, revertimos (sumar de vuelta)
      if (stockAdjusted) {
        const itemsComp = compactItems(input.items);
        await supabase.rpc("rpc_adjust_stock", { p_items: itemsComp, p_sign: 1 });
      }
    }
    throw new Error(`No se pudo crear la orden: ${e?.message ?? String(e)}`);
  }
}
export type OrderHeadRow = {
  id_order: number;
  uid: string;
  id_status: number;
  id_max_log: number | null;
  qty: number;
  sub_total: number;
  isv: number;
  delivery: number;
  ajuste: number;
  total: number;
  num_factura: string | null;
  rtn: string | null;
  latitud: number | null;
  longitud: number | null;
  tipo_dispositivo: string | null;
  observacion: string | null;
  usuario_actualiza: string | null;
  created_at: string | null;
};

export type OrderHead = OrderHeadRow;

/**
 * Obtiene órdenes desde tbl_orders_head (REST de Supabase)
 * y las devuelve con el shape de OrderHead.
 */
export async function getOrdersHeadAction(): Promise<OrderHead[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // o ANON_KEY

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  const select =
    "id_order,uid,id_status,id_max_log,qty,sub_total,isv,delivery,ajuste,total,num_factura,rtn,latitud,longitud,observacion,usuario_actualiza,fecha_creacion";

  const url = `${base}/rest/v1/tbl_orders_head?select=${encodeURIComponent(
    select
  )}&order=id_order.desc`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  console.log('res:', res);

  if (!res.ok) {
    console.error("Error al obtener órdenes:", res.status, await res.text());
    return [];
  }

  const rows: OrderHeadRow[] = await res.json();
  return rows;
}