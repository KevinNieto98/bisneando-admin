import { NextResponse } from "next/server";

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
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  // 1) Producto
  const urlProducto =
    `${base}/rest/v1/tbl_productos` +
    `?id_producto=eq.${idProducto}` +
    `&select=id_producto,nombre_producto,is_active,qty,precio,id_categoria,descripcion,id_marca`;

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
    nombre_marca, // 👈 agregado aquí
    imagenes: imgs,
  });
}
