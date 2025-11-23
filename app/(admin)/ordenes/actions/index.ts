"use server";

import { supabase } from "@/utils/supabase/client";

/* =========================================================================
   Tipos de entrada para creación de orden
   ========================================================================= */

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

/* =========================================================================
   Tipos de tablas / catálogos
   ========================================================================= */

export type OrderHeadRow = {
  id_order: number;
  uid: string;
  id_status: number | null;
  id_metodo: number | null;
  id_colonia: number | null;
  id_max_log: number | null;
  qty: number;
  sub_total: number;
  isv: number;
  delivery: number;
  ajuste: number;
  total: number;
  num_factura: string | null;
  rtn: string | null;
  latitud: string | null;
  longitud: string | null;
  observacion: string | null;
  usuario_actualiza: string | null;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
};

export type OrderDetailRow = {
  id_det: number;
  id_order: number;
  id_producto: number;
  qty: number;
  precio: number;
  sub_total: number;
  id_bodega: number | null;
};

export type OrderActivityRow = {
  id_act: number;
  id_order: number;
  id_status: number | null;
  fecha_actualizacion: string | null;
  usuario_actualiza: string | null;
  observacion: string | null;
};

export type StatusRow = {
  id_status: number;
  nombre: string | null;
};

export type ColoniaRow = {
  id_colonia: number;
  nombre_colonia: string | null;
};

export type UsuarioRow = {
  id: string; // UUID
  nombre: string | null;
  apellido: string | null;
};

export type MetodoPagoRow = {
  id_metodo: number;
  nombre_metodo: string | null;
};

// Head enriquecido con nombres
export type OrderHead = OrderHeadRow & {
  status: string | null;          // nombre del status
  nombre_colonia: string | null;  // nombre de la colonia
  usuario: string | null;         // nombre completo del dueño de la orden
  metodo_pago: string | null;     // nombre del método de pago
};

// Activity enriquecido con nombre de status
export type OrderActivity = OrderActivityRow & {
  status: string | null;          // nombre del status
};

export type FullOrderByIdResult = {
  head: OrderHead;
  det: OrderDetailRow[];
  activity: OrderActivity[];
};

/* =========================================================================
   Helpers
   ========================================================================= */

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

    // 👉 Llama el RPC que descuenta stock validando que alcance
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
      // fecha_actualizacion la puede poner la DB por default / trigger
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

/* =========================================================================
   Acción: listado de órdenes (encabezados con joins)
   ========================================================================= */

export async function getOrdersHeadAction(): Promise<OrderHead[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  const selectOrders =
    "id_order,uid,id_status,id_metodo,id_max_log,id_colonia,qty,sub_total,isv,delivery,ajuste,total,num_factura,rtn,latitud,longitud,observacion,usuario_actualiza,fecha_creacion,fecha_actualizacion";

  const selectStatus = "id_status,nombre";
  const selectColonias = "id_colonia,nombre_colonia";
  const selectUsuarios = "id,nombre,apellido";
  const selectMetodos = "id_metodo,nombre_metodo";

  const ordersUrl = `${base}/rest/v1/tbl_orders_head?select=${encodeURIComponent(
    selectOrders
  )}&order=id_order.desc`;

  const statusUrl = `${base}/rest/v1/tbl_status_orders?select=${encodeURIComponent(
    selectStatus
  )}`;

  const coloniasUrl = `${base}/rest/v1/tbl_colonias?select=${encodeURIComponent(
    selectColonias
  )}`;

  const usuariosUrl = `${base}/rest/v1/tbl_usuarios?select=${encodeURIComponent(
    selectUsuarios
  )}`;

  const metodosUrl = `${base}/rest/v1/tbl_metodos_pago?select=${encodeURIComponent(
    selectMetodos
  )}`;

  const [ordersRes, statusRes, coloniasRes, usuariosRes, metodosRes] = await Promise.all([
    fetch(ordersUrl, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    }),
    fetch(statusUrl, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    }),
    fetch(coloniasUrl, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    }),
    fetch(usuariosUrl, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    }),
    fetch(metodosUrl, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    }),
  ]);

  if (!ordersRes.ok) {
    console.error("Error al obtener órdenes:", ordersRes.status, await ordersRes.text());
    return [];
  }
  if (!statusRes.ok) {
    console.error("Error al obtener status:", statusRes.status, await statusRes.text());
    return [];
  }
  if (!coloniasRes.ok) {
    console.error("Error al obtener colonias:", coloniasRes.status, await coloniasRes.text());
    return [];
  }
  if (!usuariosRes.ok) {
    console.error("Error al obtener usuarios:", usuariosRes.status, await usuariosRes.text());
    return [];
  }
  if (!metodosRes.ok) {
    console.error(
      "Error al obtener métodos de pago:",
      metodosRes.status,
      await metodosRes.text()
    );
    return [];
  }

  const orders: OrderHeadRow[] = await ordersRes.json();
  const statuses: StatusRow[] = await statusRes.json();
  const colonias: ColoniaRow[] = await coloniasRes.json();
  const usuarios: UsuarioRow[] = await usuariosRes.json();
  const metodos: MetodoPagoRow[] = await metodosRes.json();

  const statusMap = new Map<number, string | null>();
  statuses.forEach((s) => statusMap.set(s.id_status, s.nombre ?? null));

  const coloniaMap = new Map<number, string | null>();
  colonias.forEach((c) => coloniaMap.set(c.id_colonia, c.nombre_colonia ?? null));

  // join por id STRING (UUID)
  const usuarioMap = new Map<string, string | null>();
  usuarios.forEach((u) => {
    const fullName = [u.nombre, u.apellido].filter(Boolean).join(" ").trim();
    usuarioMap.set(u.id, fullName || null);
  });

  // join por id_metodo
  const metodoPagoMap = new Map<number, string | null>();
  metodos.forEach((m) => metodoPagoMap.set(m.id_metodo, m.nombre_metodo ?? null));

  // 🔥 Aplanamos la respuesta
  const result: OrderHead[] = orders.map((row) => {
    const status =
      row.id_status != null ? statusMap.get(row.id_status) ?? null : null;

    const nombre_colonia =
      row.id_colonia != null ? coloniaMap.get(row.id_colonia) ?? null : null;

    const usuario =
      row.uid != null && row.uid !== ""
        ? usuarioMap.get(row.uid) ?? null
        : null;

    const metodo_pago =
      row.id_metodo != null ? metodoPagoMap.get(row.id_metodo) ?? null : null;

    return {
      ...row,
      status,
      nombre_colonia,
      usuario,
      metodo_pago,
    };
  });

  return result;
}

/* =========================================================================
   Acción: rechazar orden (devolver stock + log)
   ========================================================================= */

export async function rejectOrderAction(params: {
  id_order: number;
  observacion: string;
  usuario_actualiza?: string | null;
}): Promise<void> {
  const { id_order, observacion, usuario_actualiza } = params;

  if (!id_order) {
    throw new Error("Falta id_order para rechazar la orden.");
  }

  // 1) Traer detalle de la orden
  const { data: detRows, error: detErr } = await supabase
    .from("tbl_orders_det")
    .select("id_producto, qty")
    .eq("id_order", id_order);

  if (detErr) {
    throw new Error(`Error al obtener el detalle de la orden: ${detErr.message}`);
  }

  if (!detRows || detRows.length === 0) {
    throw new Error("La orden no tiene detalle asociado.");
  }

  // 2) Agrupar cantidades por producto
  const map = new Map<number, number>();
  for (const row of detRows as { id_producto: number; qty: number }[]) {
    const current = map.get(row.id_producto) ?? 0;
    map.set(row.id_producto, current + Number(row.qty));
  }

  const itemsComp = Array.from(map.entries()).map(([id_producto, qty]) => ({
    id_producto,
    qty,
  }));

  // 3) Devolver stock
  const { data: incOk, error: incErr } = await supabase.rpc(
    "rpc_adjust_stock",
    { p_items: itemsComp, p_sign: 1 } // +1 = sumar stock
  );

  if (incErr) {
    throw new Error(`No fue posible devolver el stock: ${incErr.message}`);
  }

  if (!incOk) {
    throw new Error("El RPC de ajuste de stock no confirmó la operación.");
  }

  // 4) Actualizar encabezado: id_status = 6, observación y fecha_actualizacion
  const nowIso = new Date().toISOString();

  const { error: upErr } = await supabase
    .from("tbl_orders_head")
    .update({
      id_status: 6,
      observacion,
      usuario_actualiza: usuario_actualiza ?? "admin",
      fecha_actualizacion: nowIso,
    })
    .eq("id_order", id_order);

  if (upErr) {
    throw new Error(
      `No se pudo actualizar el encabezado de la orden: ${upErr.message}`
    );
  }

  // 5) Insertar actividad en tbl_activity_orders
  const actividadRow = {
    id_order,
    id_status: 6,
    fecha_actualizacion: nowIso,
    usuario_actualiza: usuario_actualiza ?? "admin",
    observacion,
  };

  const { data: actData, error: actErr } = await supabase
    .from("tbl_activity_orders")
    .insert([actividadRow])
    .select("id_act")
    .single();

  if (actErr) {
    throw new Error(
      `No se pudo insertar la actividad de rechazo: ${actErr.message}`
    );
  }

  const id_act = actData?.id_act;

  // 6) Actualizar id_max_log en el header con el id de esta actividad
  if (id_act) {
    const { error: logErr } = await supabase
      .from("tbl_orders_head")
      .update({ id_max_log: id_act })
      .eq("id_order", id_order);

    if (logErr) {
      throw new Error(
        `No se pudo actualizar id_max_log de la orden: ${logErr.message}`
      );
    }
  }
}

/* =========================================================================
   Acción: obtener TODO de una orden por id (head + det + activity)
   ========================================================================= */

export async function getOrderByIdAction(
  id_order: number
): Promise<FullOrderByIdResult | null> {
  if (!id_order) {
    throw new Error("Falta id_order para obtener la orden.");
  }

  // 1) Traer head, det y activity en paralelo
  const [headResp, detResp, actResp] = await Promise.all([
    supabase
      .from("tbl_orders_head")
      .select(
        "id_order,uid,id_status,id_metodo,id_max_log,id_colonia,qty,sub_total,isv,delivery,ajuste,total,num_factura,rtn,latitud,longitud,observacion,usuario_actualiza,fecha_creacion,fecha_actualizacion"
      )
      .eq("id_order", id_order)
      .single(),
    supabase
      .from("tbl_orders_det")
      .select("id_det,id_order,id_producto,qty,precio,id_bodega,sub_total")
      .eq("id_order", id_order)
      .order("id_det", { ascending: true }),
    supabase
      .from("tbl_activity_orders")
      .select(
        "id_act,id_order,id_status,fecha_actualizacion,usuario_actualiza,observacion"
      )
      .eq("id_order", id_order)
      .order("id_act", { ascending: false }),
  ]);

  if (headResp.error) {
    if (headResp.error.code === "PGRST116") {
      // no encontró filas
      return null;
    }
    throw new Error(`Error al obtener encabezado: ${headResp.error.message}`);
  }

  if (detResp.error) {
    throw new Error(`Error al obtener detalle: ${detResp.error.message}`);
  }

  if (actResp.error) {
    throw new Error(`Error al obtener actividad: ${actResp.error.message}`);
  }

  const headRow = headResp.data as OrderHeadRow;
  const det = (detResp.data ?? []) as OrderDetailRow[];
  const activityRows = (actResp.data ?? []) as OrderActivityRow[];

  // 2) Catálogos
  const [statusResp, coloniasResp, usuariosResp, metodosResp] = await Promise.all([
    supabase.from("tbl_status_orders").select("id_status,nombre"),
    supabase.from("tbl_colonias").select("id_colonia,nombre_colonia"),
    supabase.from("tbl_usuarios").select("id,nombre,apellido"),
    supabase.from("tbl_metodos_pago").select("id_metodo,nombre_metodo"),
  ]);

  const statuses = (statusResp.data ?? []) as StatusRow[];
  const colonias = (coloniasResp.data ?? []) as ColoniaRow[];
  const usuarios = (usuariosResp.data ?? []) as UsuarioRow[];
  const metodos = (metodosResp.data ?? []) as MetodoPagoRow[];

  // 3) Maps
  const statusMap = new Map<number, string | null>();
  statuses.forEach((s) => statusMap.set(s.id_status, s.nombre ?? null));

  const coloniaMap = new Map<number, string | null>();
  colonias.forEach((c) => coloniaMap.set(c.id_colonia, c.nombre_colonia ?? null));

  const usuarioMap = new Map<string, string | null>();
  usuarios.forEach((u) => {
    const fullName = [u.nombre, u.apellido].filter(Boolean).join(" ").trim();
    usuarioMap.set(u.id, fullName || null);
  });

  const metodoPagoMap = new Map<number, string | null>();
  metodos.forEach((m) => metodoPagoMap.set(m.id_metodo, m.nombre_metodo ?? null));

  // 4) Head enriquecido
  const statusNombre =
    headRow.id_status != null ? statusMap.get(headRow.id_status) ?? null : null;

  const nombre_colonia =
    headRow.id_colonia != null ? coloniaMap.get(headRow.id_colonia) ?? null : null;

  const usuario =
    headRow.uid != null && headRow.uid !== ""
      ? usuarioMap.get(headRow.uid) ?? null
      : null;

  const metodo_pago =
    headRow.id_metodo != null ? metodoPagoMap.get(headRow.id_metodo) ?? null : null;

  const head: OrderHead = {
    ...headRow,
    status: statusNombre,
    nombre_colonia,
    usuario,
    metodo_pago,
  };

  // 5) Activity enriquecida
  const activity: OrderActivity[] = activityRows.map((act) => {
    const statusNombreAct =
      act.id_status != null ? statusMap.get(act.id_status) ?? null : null;
    return {
      ...act,
      status: statusNombreAct,
    };
  });

  return {
    head,
    det,
    activity,
  };
}
