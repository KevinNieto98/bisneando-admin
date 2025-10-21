// ./actions.ts
import { supabase } from "@/utils/supabase/client";

export type ColoniaRow = {
  id_colonia: number;
  nombre_colonia: string;
  is_active: boolean;
  tiene_cobertura: boolean;
  referencia: string | null;
  updated_at: string; // ISO
};

/** Obtiene todas las colonias desde tbl_colonias y las mapea al shape del front */
export async function getColoniasAction() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // o ANON_KEY

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  const url = `${base}/rest/v1/tbl_colonias?select=id_colonia,nombre_colonia,is_active,tiene_cobertura,referencia,updated_at&order=id_colonia.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener colonias:", res.status, await res.text());
    return [];
  }

  const rows: ColoniaRow[] = await res.json();

  // mapeo al tipo del front
  return rows.map((r) => ({
    id_colonia: r.id_colonia,
    nombre_colonia: r.nombre_colonia,
    activa: r.is_active,
    tiene_cobertura: r.tiene_cobertura,
    referencia: r.referencia,
    updated_at: r.updated_at,
  }));
}

/** Obtiene solo las colonias activas desde tbl_colonias y las mapea al front */
export async function getColoniasActivasAction() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  const url = `${base}/rest/v1/tbl_colonias?select=id_colonia,nombre_colonia,is_active,tiene_cobertura,referencia,updated_at&is_active=eq.true&order=id_colonia.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener colonias activas:", res.status, await res.text());
    return [];
  }

  const rows: ColoniaRow[] = await res.json();

  return rows.map((r) => ({
    id_colonia: r.id_colonia,
    nombre_colonia: r.nombre_colonia,
    activa: r.is_active,
    tiene_cobertura: r.tiene_cobertura,
    referencia: r.referencia,
    updated_at: r.updated_at,
  }));
}

/** Crea una colonia */
export async function postColoniasAction(
  nombre_colonia: string,
  is_active: boolean,
  tiene_cobertura: boolean,
  referencia: string | null
) {
  const { data, error } = await supabase
    .from("tbl_colonias")
    .insert([{ nombre_colonia, is_active, tiene_cobertura, referencia }])
    .select(
      "id_colonia,nombre_colonia,is_active,tiene_cobertura,referencia,updated_at"
    )
    .single();

  if (error) throw new Error(error.message);

  return data as {
    id_colonia: number;
    nombre_colonia: string;
    is_active: boolean;
    tiene_cobertura: boolean;
    referencia: string | null;
    updated_at: string;
  };
}

/** Actualiza una colonia */
export async function putColoniasAction(
  id: number,
  nombre_colonia: string,
  is_active: boolean,
  tiene_cobertura: boolean,
  referencia?: string | null
) {
  // Construimos el payload evitando sobreescribir referencia si no viene
  const payload: {
    nombre_colonia: string;
    is_active: boolean;
    tiene_cobertura: boolean;
    referencia?: string | null;
  } = { nombre_colonia, is_active, tiene_cobertura };

  if (typeof referencia !== "undefined") {
    payload.referencia = referencia;
  }

  const { data, error } = await supabase
    .from("tbl_colonias")
    .update(payload)
    .eq("id_colonia", Number(id))
    .select(
      "id_colonia,nombre_colonia,is_active,tiene_cobertura,referencia,updated_at"
    )
    .single();

  if (error) throw new Error(error.message);

  return data as {
    id_colonia: number;
    nombre_colonia: string;
    is_active: boolean;
    tiene_cobertura: boolean;
    referencia: string | null;
    updated_at: string;
  };
}
