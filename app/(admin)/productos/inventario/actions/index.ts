
type ProductoRow = {
  id_producto: number;
  nombre_producto: string;
  is_active: boolean;
  qty: number;
  precio: number;
  id_categoria: number;
  descripcion: string | null;
  id_marca: number | null;
  slug: string;
};

type ImagenRow = {
  id_imagen?: number;
  id_producto: number;
  url_imagen: string;
  is_principal?: boolean | null;
  orden?: number | null;
};

export type ProductoConImagenes = ProductoRow & {
  imagenes: ImagenRow[];
};

type GetProductosOpts = {
  onlyActive?: boolean;
  search?: string;          // busca en nombre y slug (ILIKE)
  categoriaId?: number;   
  id_bodega?: number  // filtro por categoría
  orderBy?: "id_producto" | "nombre_producto" | "precio" | "qty";
  orderDir?: "asc" | "desc";

};

export async function getProductosConImagenesAction(
  opts: GetProductosOpts = {}
): Promise<ProductoConImagenes[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  const {
    onlyActive = false,
    search,
    categoriaId,
    id_bodega, // ✅ nuevo parámetro opcional
    orderBy = "id_producto",
    orderDir = "asc",
  } = opts;

  // ---- 1) Productos
  const p = new URLSearchParams();
  p.set(
    "select",
    "id_producto,nombre_producto,is_active,qty,precio,id_categoria,descripcion,id_marca,slug"
  );

  // filtros
  if (onlyActive) p.set("is_active", "eq.true");
  if (typeof categoriaId === "number") p.set("id_categoria", `eq.${categoriaId}`);

  // ✅ filtro por bodega (solo si viene)
  if (typeof id_bodega === "number") p.set("id_bodega", `eq.${id_bodega}`);

  // search: PostgREST or=(col.ilike.*term*,col2.ilike.*term*)
  if (search && search.trim()) {
    const term = search.trim().replace(/\s+/g, " ");
    p.set(
      "or",
      `(nombre_producto.ilike.*${encodeURIComponent(term)}*,slug.ilike.*${encodeURIComponent(term)}*)`
    );
  }

  // orden
  p.set("order", `${orderBy}.${orderDir}`);

  const urlProductos = `${base}/rest/v1/tbl_productos?${p.toString()}`;

  const resProd = await fetch(urlProductos, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!resProd.ok) {
    console.error("Error al obtener productos:", resProd.status, await resProd.text());
    return [];
  }

  const productos: ProductoRow[] = await resProd.json();
  if (productos.length === 0) return [];

  // ---- 2) Imágenes de todos los productos de una sola vez
  const ids = productos.map((r) => r.id_producto);

  const urlImgs =
    `${base}/rest/v1/tbl_imagenes_producto` +
    `?select=id_imagen,id_producto,url_imagen,is_principal,orden` +
    `&id_producto=in.(${ids.join(",")})` +
    `&order=orden.asc.nullsfirst`;

  const resImgs = await fetch(urlImgs, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!resImgs.ok) {
    console.error("Error al obtener imágenes:", resImgs.status, await resImgs.text());
    // si falla, devolvemos productos sin imágenes
    return productos.map((p) => ({ ...p, imagenes: [] }));
  }

  const imgs: ImagenRow[] = await resImgs.json();
  const byProd = new Map<number, ImagenRow[]>();
  for (const img of imgs) {
    const arr = byProd.get(img.id_producto) ?? [];
    arr.push(img);
    byProd.set(img.id_producto, arr);
  }

  return productos.map((prod) => ({
    ...prod,
    imagenes: (byProd.get(prod.id_producto) ?? []).sort(
      (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
    ),
  }));
}


// actions/update-producto-activo.client.ts
import { supabase } from "@/utils/supabase/client";

// ---------- ACTUALIZAR SOLO is_active (cliente) ----------
export async function updateProductoActivoAction(
  id_producto: number,
  is_active: boolean
) {
  const { data, error } = await supabase
    .from("tbl_productos")
    .update({ is_active })
    .eq("id_producto", id_producto)
    .select(
      "id_producto,nombre_producto,is_active,qty,precio,id_categoria,descripcion,id_marca,slug"
    )
    .single();

  if (error) throw new Error(error.message);
  return data as {
    id_producto: number;
    nombre_producto: string;
    is_active: boolean;
    qty: number;
    precio: number;
    id_categoria: number;
    descripcion: string | null;
    id_marca: number | null;
    slug: string;
  };
}


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
