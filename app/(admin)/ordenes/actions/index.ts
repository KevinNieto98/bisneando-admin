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
  input: CreateOrderInput & { id_metodo?: number | null; id_colonia?: number | null }
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

      // 👇 aquí se guarda la observación de entrega en tbl_orders_head.observacion
      instrucciones_entrega: input.observacion ?? null,
      usuario_actualiza: input.usuario_actualiza ?? null,

      // 🆕 campos nuevos en el header (asegúrate que existan en tbl_orders_head)
      id_metodo: input.id_metodo ?? null,
      id_colonia: input.id_colonia ?? null,
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
    const itemsComp = compactItems(input.items);

    const { data: decOk, error: decErr } = await supabase.rpc(
      "rpc_adjust_stock",
      { p_items: itemsComp, p_sign: -1 }
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

export async function getOrdersHeadAction(uid?: string): Promise<OrderHead[]> {
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

  // 👇 armamos el query de órdenes usando URLSearchParams para poder agregar uid condicionalmente
  const ordersParams = new URLSearchParams();
  ordersParams.set("select", selectOrders);
  ordersParams.set("order", "id_order.desc");

  // si viene uid, filtramos por ese uid
  if (uid && uid.trim() !== "") {
    ordersParams.set("uid", `eq.${uid}`);
  }

  const ordersUrl = `${base}/rest/v1/tbl_orders_head?${ordersParams.toString()}`;

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

  const [ordersRes, statusRes, coloniasRes, usuariosRes, metodosRes] =
    await Promise.all([
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

  const usuarioMap = new Map<string, string | null>();
  usuarios.forEach((u) => {
    const fullName = [u.nombre, u.apellido].filter(Boolean).join(" ").trim();
    usuarioMap.set(u.id, fullName || null);
  });

  const metodoPagoMap = new Map<number, string | null>();
  metodos.forEach((m) => metodoPagoMap.set(m.id_metodo, m.nombre_metodo ?? null));

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
/* =====================
   Tipos auxiliares (ajusta/pega donde declaras tipos)
   ===================== */


// Tipo mínimo para resolver bodegas desde tbl_usuarios
type BodegaUsuarioRow = {
  id: string; // tbl_usuarios.id en tu código actual es string
  nombre: string | null;
  apellido: string | null;
};

/* =====================
   Tipos auxiliares (PEGAR una sola vez donde tienes tus tipos)
   ===================== */



// IMPORTANTE:
// - tbl_usuarios.id es UUID (string)  -> se usa para cruzar con head.uid
// - tbl_usuarios.id_bodega es NUMBER  -> se usa para cruzar con det.id_bodega



export type OrderDetailWithProducto = OrderDetailRow & {
  nombre_producto: string | null;
  url_imagen: string | null;
  bodega: string | null; // "id_bodega - Nombre Apellido"
};

/* =========================================================================
   Acción: obtener TODO de una orden por id (head + det + activity)
   - Soporta filtro opcional por id_bodega (DOBLE VALIDACIÓN en query det: eq(id_order) + eq(id_bodega))
   - Enriquece:
      head: status, nombre_colonia, usuario (por uid), metodo_pago
      det: nombre_producto, url_imagen, bodega ("id_bodega - Nombre Apellido") por tbl_usuarios.id_bodega
      activity: status
   ========================================================================= */




// Para resolver:
// - cliente por uid -> tbl_usuarios.id (uuid/string)
// - bodega por id_bodega -> tbl_usuarios.id_bodega (number)
type UsuarioRowConBodega = {
  id: string; // uuid en tu caso
  id_bodega: number | null;
  nombre: string | null;
  apellido: string | null;
};

export type OrderHead = OrderHeadRow & {
  status: string | null;
  nombre_colonia: string | null;
  usuario: string | null;
  metodo_pago: string | null;
};


export async function getOrderByIdAction(
  id_order: number,
  id_bodega?: number
): Promise<FullOrderByIdResult | null> {
  if (!id_order) {
    throw new Error("Falta id_order para obtener la orden.");
  }

  if (
    id_bodega !== undefined &&
    (!Number.isFinite(id_bodega) || id_bodega <= 0)
  ) {
    throw new Error("Si envía id_bodega, debe ser un número válido (> 0).");
  }

  const [headResp, detResp, actResp] = await Promise.all([
    supabase
      .from("tbl_orders_head")
      .select(
        "id_order,uid,id_status,id_metodo,id_max_log,id_colonia,qty,sub_total,isv,delivery,ajuste,total,num_factura,rtn,latitud,longitud,observacion,usuario_actualiza,fecha_creacion,fecha_actualizacion,instrucciones_entrega"
      )
      .eq("id_order", id_order)
      .single(),

    (() => {
      let q = supabase
        .from("tbl_orders_det")
        .select("id_det,id_order,id_producto,qty,precio,id_bodega,sub_total")
        .eq("id_order", id_order);

      // ✅ 1) filtro en query
      if (id_bodega !== undefined) {
        q = q.eq("id_bodega", id_bodega);
      }

      return q.order("id_det", { ascending: true });
    })(),

    supabase
      .from("tbl_activity_orders")
      .select(
        "id_act,id_order,id_status,fecha_actualizacion,usuario_actualiza,observacion"
      )
      .eq("id_order", id_order)
      .order("id_act", { ascending: false }),
  ]);

  if (headResp.error) {
    if ((headResp.error as any).code === "PGRST116") return null;
    throw new Error(`Error al obtener encabezado: ${headResp.error.message}`);
  }
  if (detResp.error) {
    throw new Error(`Error al obtener detalle: ${detResp.error.message}`);
  }
  if (actResp.error) {
    throw new Error(`Error al obtener actividad: ${actResp.error.message}`);
  }

  const headRow = headResp.data as OrderHeadRow;

  const detRowsRaw = (detResp.data ?? []) as OrderDetailRow[];

  // ✅ 2) filtro HARD (garantía): si viene id_bodega, SOLO esa bodega
  const detRows =
    id_bodega !== undefined
      ? detRowsRaw.filter((d) => Number(d.id_bodega) === Number(id_bodega))
      : detRowsRaw;

  const activityRows = (actResp.data ?? []) as OrderActivityRow[];

  // Si pidieron id_bodega y no quedó nada luego del hard filter => null
  if (id_bodega !== undefined && detRows.length === 0) {
    return null;
  }

  // Catálogos
  const [statusResp, coloniasResp, metodosResp] = await Promise.all([
    supabase.from("tbl_status_orders").select("id_status,nombre"),
    supabase.from("tbl_colonias").select("id_colonia,nombre_colonia"),
    supabase.from("tbl_metodos_pago").select("id_metodo,nombre_metodo"),
  ]);

  const statuses = (statusResp.data ?? []) as StatusRow[];
  const colonias = (coloniasResp.data ?? []) as ColoniaRow[];
  const metodos = (metodosResp.data ?? []) as MetodoPagoRow[];

  const statusMap = new Map<number, string | null>();
  statuses.forEach((s) => statusMap.set(s.id_status, s.nombre ?? null));

  const coloniaMap = new Map<number, string | null>();
  colonias.forEach((c) =>
    coloniaMap.set(c.id_colonia, c.nombre_colonia ?? null)
  );

  const metodoPagoMap = new Map<number, string | null>();
  metodos.forEach((m) =>
    metodoPagoMap.set(m.id_metodo, m.nombre_metodo ?? null)
  );

  const statusNombre =
    headRow.id_status != null ? statusMap.get(headRow.id_status) ?? null : null;

  const nombre_colonia =
    headRow.id_colonia != null
      ? coloniaMap.get(headRow.id_colonia) ?? null
      : null;

  const metodo_pago =
    headRow.id_metodo != null
      ? metodoPagoMap.get(headRow.id_metodo) ?? null
      : null;

  // det enriquecido inicial
  let det: OrderDetailWithProducto[] = detRows.map((d) => ({
    ...(d as OrderDetailRow),
    nombre_producto: null,
    url_imagen: null,
    bodega: null,
  }));

  const productIds = Array.from(
    new Set(
      detRows
        .map((d) => d.id_producto)
        .filter((id): id is number => typeof id === "number")
    )
  );

  const bodegaIds = Array.from(
    new Set(
      detRows
        .map((d) => d.id_bodega)
        .filter(
          (id): id is number =>
            id !== null &&
            id !== undefined &&
            Number.isFinite(Number(id)) &&
            Number(id) > 0
        )
        .map((id) => Number(id))
    )
  );

  // UN SOLO llamado a tbl_usuarios para: cliente por uid y bodegas por id_bodega
  const usuariosOrParts: string[] = [];
  if (headRow.uid) usuariosOrParts.push(`id.eq.${headRow.uid}`);
  if (bodegaIds.length > 0)
    usuariosOrParts.push(`id_bodega.in.(${bodegaIds.join(",")})`);

  const usuariosResp =
    usuariosOrParts.length > 0
      ? await supabase
          .from("tbl_usuarios")
          .select("id,id_bodega,nombre,apellido")
          .or(usuariosOrParts.join(","))
      : ({ data: [], error: null } as any);

  if (usuariosResp.error) {
    throw new Error(
      `Error al obtener usuarios (cliente/bodegas): ${usuariosResp.error.message}`
    );
  }

  const usuarios = (usuariosResp.data ?? []) as UsuarioRowConBodega[];

  const usuarioMap = new Map<string, string | null>();
  const bodegaNombreMap = new Map<number, string | null>();

  usuarios.forEach((u) => {
    const fullName = [u.nombre, u.apellido].filter(Boolean).join(" ").trim();
    const name = fullName || null;

    if (u.id) usuarioMap.set(u.id, name);

    if (u.id_bodega != null && Number.isFinite(Number(u.id_bodega))) {
      bodegaNombreMap.set(Number(u.id_bodega), name);
    }
  });

  const usuario =
    headRow.uid != null && headRow.uid !== ""
      ? usuarioMap.get(headRow.uid) ?? null
      : null;

  const head: OrderHead = {
    ...headRow,
    status: statusNombre,
    nombre_colonia,
    usuario,
    metodo_pago,
  };

  // Productos + imágenes
  if (productIds.length > 0) {
    const [prodResp, imgResp] = await Promise.all([
      supabase
        .from("tbl_productos")
        .select("id_producto,nombre_producto")
        .in("id_producto", productIds),

      supabase
        .from("tbl_imagenes_producto")
        .select("id_producto,url_imagen,is_principal,orden")
        .in("id_producto", productIds)
        .order("is_principal", { ascending: false })
        .order("orden", { ascending: true }),
    ]);

    if (prodResp.error) {
      throw new Error(
        `Error al obtener productos para detalles: ${prodResp.error.message}`
      );
    }
    if (imgResp.error) {
      throw new Error(
        `Error al obtener imágenes para productos: ${imgResp.error.message}`
      );
    }

    const productos = (prodResp.data ?? []) as {
      id_producto: number;
      nombre_producto: string;
    }[];

    const imgs = (imgResp.data ?? []) as {
      id_producto: number;
      url_imagen: string;
      is_principal?: boolean | null;
      orden?: number | null;
    }[];

    const nombreProdMap = new Map<number, string>();
    productos.forEach((p) =>
      nombreProdMap.set(p.id_producto, p.nombre_producto)
    );

    const imgPorProducto = new Map<number, string>();
    for (const img of imgs) {
      if (!imgPorProducto.has(img.id_producto)) {
        imgPorProducto.set(img.id_producto, img.url_imagen);
      }
    }

    det = detRows.map((d) => {
      const bodegaNombre =
        d.id_bodega != null
          ? bodegaNombreMap.get(Number(d.id_bodega)) ?? null
          : null;

      return {
        ...d,
        nombre_producto: nombreProdMap.get(d.id_producto) ?? null,
        url_imagen: imgPorProducto.get(d.id_producto) ?? null,
        bodega:
          d.id_bodega != null
            ? `${d.id_bodega} - ${bodegaNombre ?? "Sin nombre"}`
            : null,
      };
    });
  } else {
    det = detRows.map((d) => {
      const bodegaNombre =
        d.id_bodega != null
          ? bodegaNombreMap.get(Number(d.id_bodega)) ?? null
          : null;

      return {
        ...d,
        nombre_producto: null,
        url_imagen: null,
        bodega:
          d.id_bodega != null
            ? `${d.id_bodega} - ${bodegaNombre ?? "Sin nombre"}`
            : null,
      };
    });
  }

  const activity: OrderActivity[] = activityRows.map((act) => {
    const statusNombreAct =
      act.id_status != null ? statusMap.get(act.id_status) ?? null : null;
    return { ...act, status: statusNombreAct };
  });

  return { head, det, activity };
}






type OrderDetailRow = {
  url_imagen: string | null ;
  id_det: number;
  id_order: number;
  id_producto: number;
  qty: number;
  precio: number;
  id_bodega: number;
  sub_total: number;
};



export type TodayOrdersSummary = {
  nuevas: number;
  en_proceso: number;
  finalizadas: number;
  problemas: number;   // 🆕 órdenes con problemas (status 7)
  total: number;
};

// 📌 Resumen de órdenes de hoy
export async function getTodayOrdersSummaryAction(): Promise<TodayOrdersSummary> {
  // Calculamos inicio y fin del día de hoy en UTC (ajusta si usas otra zona)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const isoStart = start.toISOString();
  const isoEnd = end.toISOString();

  const [nuevasRes, procesoRes, finalRes, problemasRes] = await Promise.all([
    // ✅ NUEVAS: sin restricción de fecha (status = 1)
    supabase
      .from("tbl_orders_head")
      .select("id_order", { count: "exact", head: true })
      .eq("id_status", 1),

    // ✅ EN PROCESO: sin restricción de fecha (status 2,3,4)
    supabase
      .from("tbl_orders_head")
      .select("id_order", { count: "exact", head: true })
      .in("id_status", [2, 3, 4]),

    // ✅ FINALIZADAS (entregadas/rechazadas): solo las de HOY (status 5,6)
    supabase
      .from("tbl_orders_head")
      .select("id_order", { count: "exact", head: true })
      .in("id_status", [5, 6])
      .gte("fecha_actualizacion", isoStart)
      .lt("fecha_actualizacion", isoEnd),

    // ✅ ORDENES CON PROBLEMAS (status 7): solo las de HOY
    supabase
      .from("tbl_orders_head")
      .select("id_order", { count: "exact", head: true })
      .eq("id_status", 7)
      .gte("fecha_actualizacion", isoStart)
      .lt("fecha_actualizacion", isoEnd),
  ]);

  if (nuevasRes.error) {
    throw new Error(
      `Error al contar órdenes nuevas: ${nuevasRes.error.message}`
    );
  }
  if (procesoRes.error) {
    throw new Error(
      `Error al contar órdenes en proceso: ${procesoRes.error.message}`
    );
  }
  if (finalRes.error) {
    throw new Error(
      `Error al contar órdenes finalizadas: ${finalRes.error.message}`
    );
  }
  if (problemasRes.error) {
    throw new Error(
      `Error al contar órdenes con problemas: ${problemasRes.error.message}`
    );
  }

  const nuevas = nuevasRes.count ?? 0;
  const en_proceso = procesoRes.count ?? 0;
  const finalizadas = finalRes.count ?? 0;
  const problemas = problemasRes.count ?? 0;

  const total = nuevas + en_proceso + finalizadas + problemas;

  return { nuevas, en_proceso, finalizadas, problemas, total };
}

// =========================================================================
// Acción: actualizar orden a un status específico (5, 6, 7, etc.)
// =========================================================================

export async function updateOrderStatusByIdAction(params: {
  id_order: number;
  id_status_destino: number;           // <- aquí pasas 5, 6, 7, etc.
  observacion?: string | null;
  usuario_actualiza?: string | null;
}): Promise<{
  id_order: number;
  from_status: number;
  to_status: number;
  id_act?: number;
}> {
  const { id_order, id_status_destino, observacion, usuario_actualiza } = params;

  if (!id_order) {
    throw new Error("Falta id_order para actualizar la orden.");
  }

  // 1) Traer encabezado para saber el status actual
  const { data: head, error: headErr } = await supabase
    .from("tbl_orders_head")
    .select("id_order,id_status")
    .eq("id_order", id_order)
    .single();

  if (headErr) {
    throw new Error(
      `No se pudo obtener la orden para actualizar: ${headErr.message}`
    );
  }

  if (head.id_status == null) {
    throw new Error("La orden no tiene un status actual definido.");
  }

  const fromStatus = head.id_status as number;

  // 2) Si el destino es 6 (rechazada), usamos la lógica especial que ya tienes
  if (id_status_destino === 6) {
    // Aquí se devuelve stock, se actualiza head, activity e id_max_log
    await rejectOrderAction({
      id_order,
      observacion: observacion ?? "Orden rechazada",
      usuario_actualiza: usuario_actualiza ?? "admin",
    });

    return {
      id_order,
      from_status: fromStatus,
      to_status: 6,
    };
  }

  // 3) Para otros estados (5 terminada, 7 problemas, etc.) actualizamos directo

  const nowIso = new Date().toISOString();
  const usuario = usuario_actualiza ?? "admin";
  const obs = observacion ?? null;

  // 3.1) Actualizar encabezado
  const { error: upErr } = await supabase
    .from("tbl_orders_head")
    .update({
      id_status: id_status_destino,
      observacion: obs,
      usuario_actualiza: usuario,
      fecha_actualizacion: nowIso,
    })
    .eq("id_order", id_order);

  if (upErr) {
    throw new Error(
      `No se pudo actualizar el encabezado de la orden: ${upErr.message}`
    );
  }

  // 3.2) Insertar actividad
  const actividadRow = {
    id_order,
    id_status: id_status_destino,
    fecha_actualizacion: nowIso,
    usuario_actualiza: usuario,
    observacion: obs,
  };

  const { data: actData, error: actErr } = await supabase
    .from("tbl_activity_orders")
    .insert([actividadRow])
    .select("id_act")
    .single();

  if (actErr) {
    throw new Error(
      `No se pudo insertar la actividad de actualización: ${actErr.message}`
    );
  }

  const id_act = actData?.id_act as number | undefined;

  // 3.3) Actualizar id_max_log en el header
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

  return {
    id_order,
    from_status: fromStatus,
    to_status: id_status_destino,
    id_act,
  };
}


export async function advanceOrderToNextStatusAction(params: {
  id_order: number;
  observacion: string;
  usuario_actualiza?: string | null;
}): Promise<void> {
  const { id_order, observacion, usuario_actualiza } = params;

  if (!id_order) {
    throw new Error("Falta id_order para avanzar la orden.");
  }

  // 1) Obtener status actual de la orden
  const { data: headRow, error: headErr } = await supabase
    .from("tbl_orders_head")
    .select("id_status")
    .eq("id_order", id_order)
    .single();

  if (headErr) {
    throw new Error(
      `Error al obtener encabezado de la orden para avanzar: ${headErr.message}`
    );
  }

  const currentStatus: number | null = headRow?.id_status ?? null;
  if (currentStatus == null) {
    throw new Error("La orden no tiene un status actual definido.");
  }

  // 2) Obtener siguiente status desde tbl_status_orders
  const { data: statusRow, error: statusErr } = await supabase
    .from("tbl_status_orders")
    .select("next_status")
    .eq("id_status", currentStatus)
    .single();

  if (statusErr) {
    throw new Error(
      `Error al obtener el siguiente status del flujo: ${statusErr.message}`
    );
  }

  const nextStatus: number | null = statusRow?.next_status ?? null;

  if (!nextStatus) {
    throw new Error(
      "El status actual no tiene un siguiente paso configurado en tbl_status_orders."
    );
  }

  // 3) Reusar tu acción genérica para actualizar orden + activity + id_max_log
  await updateOrderStatusByIdAction({
    id_order,
    id_status_destino: nextStatus,
    observacion,
    usuario_actualiza: usuario_actualiza ?? "admin",
  });
}



export type VwOrdersHeadRow = {
  id_bodega: number | null;
  id_order: number;
  cantidad: number | null;
  total: number | null;
  uid: string | null;
  fecha_creacion: string | null;
  id_status: number | null;
  status: string | null;
  nombre_usuario: string | null;
};

/* =========================================================================
   Acción: listar órdenes por id_bodega desde la vista VW_ORDERS_HEAD
   ========================================================================= */


export async function getOrdersHeadByBodegaAction(
  id_bodega: number
): Promise<VwOrdersHeadRow[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // o ANON_KEY

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  if (!Number.isFinite(id_bodega) || id_bodega <= 0) {
    console.error("id_bodega inválido:", id_bodega);
    return [];
  }

  // IMPORTANTE: en PostgREST/Supabase, usa minúsculas por defecto
  // Si tu vista realmente se llama distinto, ajusta aquí: vw_orders_head
  const qs = new URLSearchParams();
  qs.set(
    "select",
    "id_bodega,id_order,cantidad,total,uid,fecha_creacion,id_status,status,nombre_usuario"
  );
  qs.set("id_bodega", `eq.${id_bodega}`);
  qs.set("order", "fecha_creacion.desc,id_order.desc");

  const url = `${base}/rest/v1/vw_orders_head?${qs.toString()}`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(
      "Error al obtener órdenes por bodega:",
      res.status,
      await res.text()
    );
    return [];
  }

  const data = (await res.json().catch(() => [])) as VwOrdersHeadRow[];
  return Array.isArray(data) ? data : [];
}



export async function getOrdersDetByBodegaAction(
  id_bodega: number
): Promise<VwOrdersDetRow[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // o ANON_KEY

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  if (!Number.isFinite(id_bodega) || id_bodega <= 0) {
    console.error("id_bodega inválido:", id_bodega);
    return [];
  }

  // Query params PostgREST
  const qs = new URLSearchParams();
  qs.set(
    "select",
    "id_det,id_order,id_producto,qty,precio,sub_total,id_bodega,nombre_producto,url_imagen"
  );
  qs.set("id_bodega", `eq.${id_bodega}`);
  qs.set("order", "id_order.desc,id_det.asc");

  const url = `${base}/rest/v1/vw_orders_det?${qs.toString()}`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(
      "Error al obtener detalle de órdenes por bodega:",
      res.status,
      await res.text()
    );
    return [];
  }

  const data = (await res.json().catch(() => [])) as VwOrdersDetRow[];
  return Array.isArray(data) ? data : [];
}

export type VwOrdersDetRow = {
  id_det: number;
  id_order: number;
  id_producto: number;
  qty: number;
  precio: number;
  sub_total: number;
  id_bodega: number | null;
  nombre_producto: string | null;
  url_imagen: string | null;
};


// Tipado base tal como viene de Supabase
export interface ActivityOrderRow {
  id_act: number
  id_order: number
  id_status: number
  fecha_actualizacion: string
  usuario_actualiza: string | null
  observacion: string | null
}

// Shape que consumes en el front (si deseas adaptar nombres)
export interface ActivityOrder {
  id_act: number
  id_order: number
  id_status: number
  fecha_actualizacion: string
  usuario_actualiza: string | null
  observacion: string | null
}

export async function getActivityOrdersByOrderIdAction(id_order: number) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY // o ANON_KEY

  if (!base || !apiKey) {
    console.error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    )
    return []
  }

  // Construcción del query REST equivalente
  const params = new URLSearchParams({
    select:
      'id_act,id_order,id_status,fecha_actualizacion,usuario_actualiza,observacion',
    id_order: `eq.${id_order}`,
    order: 'id_act.desc',
  })

  const url = `${base}/rest/v1/tbl_activity_orders?${params.toString()}`

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error(
      'Error al obtener activity orders:',
      res.status,
      await res.text()
    )
    return []
  }

  const rows: ActivityOrderRow[] = await res.json()

  // En este caso el shape ya coincide, pero se deja el mapeo explícito
  return rows.map((r) => ({
    id_act: r.id_act,
    id_order: r.id_order,
    id_status: r.id_status,
    fecha_actualizacion: r.fecha_actualizacion,
    usuario_actualiza: r.usuario_actualiza,
    observacion: r.observacion,
  }))
}
