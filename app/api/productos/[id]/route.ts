import { NextResponse } from "next/server";

// ✅ ajusta estas rutas a donde tengas tus actions reales
import {
  updateProductoAction,
  insertImagenesProductosAction,
  deleteMissingImagenesAction,
  reorderImagenesAction,
} from "@/app/(admin)/productos/[id]/actions";

/**
 * NOTA:
 * - Expo/RN sube imágenes directo a Supabase Storage (anon).
 * - Este endpoint SOLO recibe URLs (keepUrls/newUrls) y actualiza la BD.
 * - Por eso NO usamos SUPABASE_SERVICE_ROLE_KEY ni multipart.
 */

// ✅ GET: tu implementación (solo le agregué en_revision al select)
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const idProducto = Number(id);

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    return NextResponse.json(
      { error: "Faltan variables de entorno" },
      { status: 500 }
    );
  }

  if (!idProducto || Number.isNaN(idProducto)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  // 1) Producto
  const urlProducto =
    `${base}/rest/v1/tbl_productos` +
    `?id_producto=eq.${idProducto}` +
    `&select=id_producto,nombre_producto,is_active,qty,precio,id_categoria,descripcion,id_marca,en_revision,slug`;

  const resProd = await fetch(urlProducto, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!resProd.ok) {
    const msg = await resProd.text();
    return NextResponse.json({ error: msg }, { status: resProd.status });
  }

  const prodRows = await resProd.json();
  const producto = prodRows?.[0];
  if (!producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  // 2) Imágenes
  const urlImgs =
    `${base}/rest/v1/tbl_imagenes_producto` +
    `?id_producto=eq.${idProducto}` +
    `&select=id_producto,url_imagen,is_principal,orden` +
    `&order=orden.asc.nullsfirst`;

  const resImgs = await fetch(urlImgs, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  const imgs = resImgs.ok ? await resImgs.json() : [];

  // 3) Marca
  let nombre_marca: string | null = null;
  if (producto.id_marca) {
    const urlMarca =
      `${base}/rest/v1/tbl_marcas` +
      `?id_marca=eq.${producto.id_marca}` +
      `&select=nombre_marca`;

    const resMarca = await fetch(urlMarca, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (resMarca.ok) {
      const marcaRows = await resMarca.json();
      nombre_marca = marcaRows?.[0]?.nombre_marca ?? null;
    }
  }

  return NextResponse.json({
    ...producto,
    nombre_marca,
    imagenes: imgs,
  });
}

type UpdateBody = {
  nombre_producto: string;
  is_active: boolean;
  qty: number;
  slug: string;
  precio: number;
  id_categoria: number;
  descripcion: string;
  id_marca?: number | null;

  // ✅ SOLO URLs (Expo sube storage, backend guarda DB)
  keepUrls?: string[];
  newUrls?: string[];

  en_revision?: boolean;
};

function logStep(tag: string, extra?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  console.log(`[PUT /api/productos/[id]] ${ts} ${tag}`, extra ?? {});
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const started = Date.now();

  try {
    const { id } = await context.params;
    const idProducto = Number(id);

    logStep("start", {
      id,
      idProducto,
      method: req.method,
      url: req.url,
      contentType: req.headers.get("content-type"),
    });

    if (!Number.isFinite(idProducto) || idProducto <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      // ✅ forzamos JSON para evitar multipart por accidente
      return NextResponse.json(
        { error: "Content-Type debe ser application/json" },
        { status: 415 }
      );
    }

    const body = (await req.json()) as UpdateBody;

    const {
      nombre_producto,
      is_active,
      qty,
      slug,
      precio,
      id_categoria,
      descripcion,
      id_marca,
      keepUrls = [],
      newUrls = [],
    } = body ?? ({} as any);

    // -------- validaciones mínimas --------
    if (typeof nombre_producto !== "string" || !nombre_producto.trim()) {
      return NextResponse.json(
        { error: "nombre_producto es requerido." },
        { status: 400 }
      );
    }
    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active debe ser boolean." },
        { status: 400 }
      );
    }

    const qtyNum = Number(qty);
    if (!Number.isFinite(qtyNum) || qtyNum < 0) {
      return NextResponse.json(
        { error: "qty debe ser numérico (>= 0)." },
        { status: 400 }
      );
    }

    const precioNum = Number(precio);
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      return NextResponse.json(
        { error: "precio debe ser numérico (>= 0)." },
        { status: 400 }
      );
    }

    const catNum = Number(id_categoria);
    if (!Number.isFinite(catNum) || catNum <= 0) {
      return NextResponse.json(
        { error: "id_categoria inválido." },
        { status: 400 }
      );
    }

    if (typeof descripcion !== "string") {
      return NextResponse.json(
        { error: "descripcion es requerida." },
        { status: 400 }
      );
    }

    const marcaParsed: number | null =
      typeof id_marca === "number" ? id_marca : id_marca === null ? null : null;

    // -------- 1) update producto --------
    logStep("updateProductoAction:begin");
    const updated = await updateProductoAction(idProducto, {
      nombre_producto: nombre_producto.trim(),
      is_active,
      qty: qtyNum,
      slug: typeof slug === "string" ? slug.trim() : "",
      precio: precioNum,
      id_categoria: catNum,
      descripcion: descripcion.trim(),
      id_marca: marcaParsed,
      en_revision: true,
    });
    logStep("updateProductoAction:done");

    // -------- 2) imágenes por URLs --------
    const keep = Array.isArray(keepUrls)
      ? keepUrls
          .filter((u) => typeof u === "string")
          .map((u) => u.trim())
          .filter(Boolean)
      : [];

    const news = Array.isArray(newUrls)
      ? newUrls
          .filter((u) => typeof u === "string")
          .map((u) => u.trim())
          .filter(Boolean)
      : [];

    // borrar las que ya no existen
    await deleteMissingImagenesAction(idProducto, keep);

    // insertar nuevas
    if (news.length > 0) {
      const start = keep.length;
      const rows = news.map((url, i) => ({
        id_producto: idProducto,
        url_imagen: url,
        is_principal: false,
        orden: start + i + 1,
      }));
      await insertImagenesProductosAction(rows);
    }

    // reordenar y marcar principal (primera)
    const finalUrls = [...keep, ...news];
    if (finalUrls.length > 0) {
      await reorderImagenesAction(idProducto, finalUrls);
    }

    logStep("success", { ms: Date.now() - started, finalCount: finalUrls.length });

    return NextResponse.json({
      ok: true,
      producto: updated,
      imagenes_final: finalUrls,
    });
  } catch (error: any) {
    console.error("[PUT /api/productos/[id]] catch:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });

    return NextResponse.json(
      { error: error?.message ?? "Error al actualizar el producto." },
      { status: 500 }
    );
  }
}
