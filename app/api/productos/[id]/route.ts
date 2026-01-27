import { updateProductoAction } from "@/app/(admin)/productos/[id]/actions";
import { NextResponse } from "next/server";

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
    `&select=id_producto,nombre_producto,is_active,qty,precio,id_categoria,descripcion,id_marca,en_revision`;

  const resProd = await fetch(urlProducto, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
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
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
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
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
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

// ✅ PUT: actualiza usando tu action (con en_revision opcional default false en el action)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idProducto = Number(id);

    if (!Number.isFinite(idProducto) || idProducto <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    const {
      nombre_producto,
      is_active,
      qty,
      slug,
      precio,
      id_categoria,
      descripcion,
      id_marca,
      en_revision, // opcional
    } = body ?? {};

    // Validaciones mínimas (suaves)
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

    // id_marca puede ser number o null o undefined
    const marcaParsed: number | null | undefined =
      typeof id_marca === "number"
        ? id_marca
        : id_marca === null
        ? null
        : undefined;

    const updated = await updateProductoAction(idProducto, {
      nombre_producto: nombre_producto.trim(),
      is_active,
      qty: qtyNum,
      slug: typeof slug === "string" ? slug.trim() : "",
      precio: precioNum,
      id_categoria: catNum,
      descripcion: descripcion.trim(),
      id_marca: marcaParsed ?? null,
      en_revision: typeof en_revision === "boolean" ? en_revision : undefined, // si no viene, el action lo pone false
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error en PUT /api/productos/[id]:", error);
    return NextResponse.json(
      { error: error?.message ?? "Error al actualizar el producto." },
      { status: 500 }
    );
  }
}
