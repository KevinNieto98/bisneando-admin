/** Obtiene todas las categorías activas desde tbl_categorias */

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
