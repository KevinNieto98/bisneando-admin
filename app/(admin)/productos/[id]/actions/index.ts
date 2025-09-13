/** Obtiene todas las categorías activas desde tbl_categorias */

import { supabase } from "@/utils/supabase/client"

export type CategoriaRow = {
  id_categoria: number
  nombre_categoria: string

} 

export async function getCategoriasActivasAction() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY // o ANON_KEY

  if (!base || !apiKey) {
    console.error('Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    return []
  }

  // 👇 agregamos el filtro is_active=eq.true
  const url = `${base}/rest/v1/tbl_categorias?select=id_categoria,nombre_categoria,is_active,icono&is_active=eq.true&order=id_categoria.asc`

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: 'no-store', // 👈 evitar cache si quieres datos frescos siempre
  })

  if (!res.ok) {
    console.error('Error al obtener categorías activas:', res.status, await res.text())
    return []
  }

  const rows: CategoriaRow[] = await res.json()

  // mapeo al tipo del front
  return rows.map((r) => ({
    id_categoria: r.id_categoria,
    nombre_categoria: r.nombre_categoria,
  }))
}



export type MarcaRow = {
  id_marca: number;
  nombre_marca: string;
  is_active: boolean;
  // icono?: string | null; // <- NO existe en esta tabla
};

export async function getMarcasActivasAction(): Promise<MarcaRow[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  const params = new URLSearchParams({
    select: "id_marca,nombre_marca,is_active",
    is_active: "eq.true",
    order: "id_marca.asc",
  });

  const url = `${base}/rest/v1/tbl_marcas?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
    
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.error("Error al obtener marcas activas:", res.status, await res.text());
    return [];
  }

  return res.json() as Promise<MarcaRow[]>;
}

export async function postProductosAction(
  nombre_producto: string,
  is_active: boolean,
  qty: number,
  slug: string,
  precio: number,
  id_categoria: number,
  descripcion: string,
  id_marca?: number | null, // 👈 opcional
) {
  // Construye la fila sin id_marca y agrégalo solo si viene
  const row: any = {
    nombre_producto,
    is_active,
    qty,
    slug,
    precio,
    id_categoria,
    descripcion,
  };
  if (id_marca != null) {
    row.id_marca = id_marca; // 👈 solo si hay valor
  }

  const { data, error } = await supabase
    .from('tbl_productos')
    .insert([row])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as {
    id_producto: number;
    nombre_producto: string;
    is_active: boolean;
    qty: number;
    slug: string;
    precio: number;
    id_categoria: number;
    descripcion: string;
    fecha_creacion: string;
    usuario_creacion: string;
    usuario_actualiza?: string;
    fecha_actualizacion?: string;
    id_marca?: number | null; // 👈 si tu vista/BD lo devuelve
  };
}




export async function insertImagenesProductosAction(rows: ImagenRow[]) {
  if (!rows?.length) return [];

  const { data, error } = await supabase
    .from("tbl_imagenes_producto")
    .insert(rows)
    .select();

  if (error) throw new Error(error.message);

  // Asumiendo que id_imagen es autoincremental y fecha_creacion tiene DEFAULT CURRENT_TIMESTAMP
  return data as {
    id_imagen: number;
    id_producto: number;
    url_imagen: string;
    is_principal: boolean;
    orden: number;
    fecha_creacion: string;
  }[];
}

// types (ajústalos a tu proyecto si ya los tienes en otro archivo)
type ProductoRow = {
  id_producto: number;
  nombre_producto: string;
  is_active: boolean;
  qty: number;
  precio: number;
  id_categoria: number;
  descripcion: string | null;
  id_marca: number | null;
};

type ImagenRow = {
  id_producto: number;
  url_imagen: string;
  is_principal?: boolean | null;
  orden?: number | null;
};

// tipo de retorno
type ProductoConImagenes = ProductoRow & {
  imagenes: ImagenRow[];
};

export async function getProductoByIdAction(idProducto: number): Promise<ProductoConImagenes | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // o ANON_KEY

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return null;
  }

  if (!idProducto || Number.isNaN(Number(idProducto))) {
    console.error("getProductoByIdAction: idProducto inválido:", idProducto);
    return null;
  }

  // 1) Traer el producto
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
    console.error("Error al obtener producto:", resProd.status, await resProd.text());
    return null;
  }

  const prodRows: ProductoRow[] = await resProd.json();
  const producto = prodRows?.[0];
  if (!producto) return null;

  // 2) Traer imágenes ordenadas por 'orden' (✅ FIX: usar puntos en order)
  const urlImgs =
    `${base}/rest/v1/tbl_imagenes_producto` +
    `?id_producto=eq.${idProducto}` +
    `&select=id_producto,url_imagen,is_principal,orden` +
    `&order=orden.asc.nullsfirst`; // <- antes estaba con coma

  const resImgs = await fetch(urlImgs, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!resImgs.ok) {
    console.error("Error al obtener imágenes del producto:", resImgs.status, await resImgs.text());
    return { ...producto, imagenes: [] }; // devolvemos el producto sin imágenes si falla
  }

  const imgs: ImagenRow[] = await resImgs.json();

  return {
    ...producto,
    imagenes: Array.isArray(imgs) ? imgs : [],
  };
}


// ---------- UPDATE PRODUCTO ----------
export async function updateProductoAction(
  id_producto: number,
  payload: {
    nombre_producto: string;
    is_active: boolean;
    qty: number;
    slug: string;
    precio: number;
    id_categoria: number;
    descripcion: string;
    id_marca?: number | null;
  }
) {
  const { data, error } = await supabase
    .from("tbl_productos")
    .update(payload)
    .eq("id_producto", id_producto)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ---------- HELPERS PARA STORAGE ----------
function parseStorageFromPublicUrl(publicUrl: string) {
  // Ej: https://.../storage/v1/object/public/imagenes_productos/123/abc.png
  const m = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  const bucket = m[1];
  const path = decodeURIComponent(m[2]);
  return { bucket, path };
}

// ---------- BORRAR IMÁGENES FALTANTES ----------
export async function deleteMissingImagenesAction(
  id_producto: number,
  keepPublicUrls: string[]
) {
  // Traer imágenes actuales
  const { data: actuales, error: qErr } = await supabase
    .from("tbl_imagenes_producto")
    .select("id_imagen,url_imagen")
    .eq("id_producto", id_producto);

  if (qErr) throw new Error(qErr.message);

  const toDelete = (actuales ?? []).filter(
    (r) => !keepPublicUrls.includes(r.url_imagen)
  );

  if (toDelete.length === 0) return;

  // 1) Borrar filas en BD
  const ids = toDelete.map((r) => r.id_imagen);
  const { error: dErr } = await supabase
    .from("tbl_imagenes_producto")
    .delete()
    .in("id_imagen", ids);
  if (dErr) throw new Error(dErr.message);

  // 2) Intentar borrar del storage si pertenecen a nuestro bucket público
  //    (si algunas no son del bucket, simplemente se omiten)
  const bucketToPaths: Record<string, string[]> = {};
  for (const r of toDelete) {
    const parsed = parseStorageFromPublicUrl(r.url_imagen);
    if (!parsed) continue;
    bucketToPaths[parsed.bucket] ??= [];
    bucketToPaths[parsed.bucket].push(parsed.path);
  }

  for (const [bucket, paths] of Object.entries(bucketToPaths)) {
    if (paths.length === 0) continue;
    const { error: sErr } = await supabase.storage.from(bucket).remove(paths);
    // Nota: si no tienes permisos para remove con anon, esto puede fallar. 
    // Puedes ignorar el error o loguearlo:
    if (sErr) console.warn("No se pudieron borrar algunos objetos:", sErr.message);
  }
}

// ---------- REORDENAR Y MARCAR PRINCIPAL ----------
export async function reorderImagenesAction(
  id_producto: number,
  finalUrls: string[]
) {
  // Por simplicidad, actualizamos una por una por url
  for (let i = 0; i < finalUrls.length; i++) {
    const url = finalUrls[i];
    const isPrincipal = i === 0;
    const { error } = await supabase
      .from("tbl_imagenes_producto")
      .update({ orden: i + 1, is_principal: isPrincipal })
      .eq("id_producto", id_producto)
      .eq("url_imagen", url);
    if (error) throw new Error(error.message);
  }
}
