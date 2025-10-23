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

export type Colonia = {
  id_colonia: number;
  nombre_colonia: string;
  is_active: boolean;
  tiene_cobertura: boolean;
  referencia: string | null;
  updated_at: string; // ISO
};

export async function getColoniasconConberturaAction(): Promise<Colonia[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // ANON_KEY

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  const url =
    `${base}/rest/v1/tbl_colonias` +
    `?select=id_colonia,nombre_colonia,is_active,tiene_cobertura,referencia,updated_at` +
    `&is_active.eq.true&tiene_cobertura.eq.true` + // <-- filtros
    `&order=id_colonia.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      // Prefer: "count=exact", // (opcional) si quieres total vía Content-Range
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener colonias:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as Colonia[];
  return data;
}

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




type PostDireccionInput = {
  uid: string;
  latitude: number;
  longitude: number;
  tipo_direccion: number;
  id_colonia?: number | null;
  nombre_direccion?: string | null; // "Casa", "Oficina", etc.
  isPrincipal?: boolean;            // default false
  referencia?: string | null;
};

/**
 * Inserta una dirección en tbl_direcciones y devuelve la fila creada.
 * Importante: si necesitas que isPrincipal sea único por uid, maneja ese
 * comportamiento aparte (p. ej. trigger o lógica adicional).
 */
export async function postDireccionAction(input: PostDireccionInput) {
  const {
    uid,
    latitude,
    longitude,
    id_colonia = null,
    nombre_direccion = null,
    isPrincipal = false,    // viene camelCase desde el front/route
    referencia = null,
    tipo_direccion= 1,
  } = input;

  // Asegurar 7 decimales (DECIMAL(10,7))
  const payload = {
    uid,
    latitude: Number(latitude.toFixed(7)).toString(),
    longitude: Number(longitude.toFixed(7)).toString(),
    id_colonia,
    nombre_direccion,
    // ⚠️ MUY IMPORTANTE: la columna se llama isprincipal en Postgres
    isprincipal: Boolean(isPrincipal),
    referencia,
    tipo_direccion,
  };

  console.log("[postDireccionAction] payload to insert:", payload);

  const { data, error } = await supabase
    .from("tbl_direcciones")
    .insert([payload])
    .select(
      "id_direccion, uid, latitude, longitude, id_colonia, nombre_direccion, isprincipal, referencia, created_at, updated_at, tipo_direccion"
    )
    .single();

  if (error) {
    console.error("[postDireccionAction] insert error:", error);
    throw new Error(error.message);
  }

  // Retorna con camelCase en el objeto (si quieres mantener interfaz):
  const mapped = {
    ...data,
    isPrincipal: data.isprincipal, // normaliza a camelCase para el front
  };
  delete (mapped as any).isprincipal;

  console.log("[postDireccionAction] insert OK, mapped:", mapped);
  return mapped as DireccionRow;
}



// Tipos crudos tal como vienen de la tabla (posibles variantes de la col. principal)
export type DireccionRow = {
  id_direccion: number;
  uid: string;
  latitude: number;        // DECIMAL -> PostgREST suele devolver number/string; aquí número
  longitude: number;
  tipo_direccion: number;
  id_colonia: number | null;
  nombre_direccion: string | null;
  isprincipal?: boolean;   // <- nombre más probable en DB
  is_principal?: boolean;  // <- por si la creaste snake_case
  isPrincipal?: boolean;   // <- por si la creaste quoted camelCase (menos común)
  referencia: string | null;
  created_at: string;      // ISO
  updated_at: string;      // ISO
};

// Tipo normalizado para el front
export type Direccion = {
  id_direccion: number;
  uid: string;
  latitude: number;
  longitude: number;
  tipo_direccion: number;
  id_colonia: number | null;
  nombre_direccion: string | null;
  isPrincipal: boolean;     // <- normalizado
  referencia: string | null;
  created_at: string;
  updated_at: string;
};

/** Obtiene direcciones del usuario por uid (más "principal" primero) */
export async function getDireccionesByUidAction(uid: string): Promise<Direccion[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // ANON_KEY

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  // NOTA: uso isprincipal en order porque es lo más probable en Postgres.
  // Si tu columna es is_principal, cambia 'isprincipal' -> 'is_principal'.
  const params = new URLSearchParams({
    select:
      "id_direccion,uid,latitude,longitude,id_colonia,nombre_direccion,isprincipal,referencia,created_at,updated_at,tipo_direccion",
    "uid": `eq.${uid}`,
    "order": "isprincipal.desc,created_at.desc",
  });

  const url = `${base}/rest/v1/tbl_direcciones?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      // Prefer: "count=exact", // si luego necesitas total en Content-Range
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener direcciones:", res.status, await res.text());
    return [];
  }

  const rows = (await res.json()) as DireccionRow[];

  // Mapeo/normalización para el front:
  return rows.map((r) => ({
    id_direccion: r.id_direccion,
    uid: r.uid,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    id_colonia: r.id_colonia ?? null,
    nombre_direccion: r.nombre_direccion ?? null,
    isPrincipal: Boolean(
      // prioriza la que de verdad exista en tu tabla
      (r as any).isprincipal ?? (r as any).is_principal ?? (r as any).isPrincipal ?? false
    ),
    referencia: r.referencia ?? null,
    created_at: r.created_at,
    tipo_direccion: r.tipo_direccion,
    updated_at: r.updated_at,
  }));
}
