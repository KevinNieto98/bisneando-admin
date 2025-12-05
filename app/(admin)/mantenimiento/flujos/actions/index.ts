// app/(admin)/mantenimiento/flujos/actions/status-actions.ts
// o la ruta que estés usando
import { supabase } from "@/utils/supabase/client";

export interface StatusOrder {
  id_status: number;
  nombre: string;
  next_status: number | null;
  last_status: boolean;
  next_status_nombre?: string | null;
}

// Para usar en UI si quieres, pero YA NO es obligatorio para el insert:
export function nextIdStatus(data: StatusOrder[]): number {
  if (!data.length) return 1;
  return data.reduce((max, s) => (s.id_status > max ? s.id_status : max), 0) + 1;
}

// GET sigue por REST para que puedas llamarlo desde el cliente con fetch
export async function getStatusOrdersAction(): Promise<StatusOrder[]> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tbl_status_orders?select=*&order=id_status.asc`;

  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!apiKey) {
    console.error("Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el entorno");
    return [];
  }

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(
      "Error al obtener status orders:",
      res.status,
      await res.text()
    );
    return [];
  }

  const data = (await res.json()) as StatusOrder[];

  // Mapa para resolver nombres por id_status
  const mapa = new Map<number, string>();
  data.forEach((s) => mapa.set(s.id_status, s.nombre));

  // Agregar next_status_nombre al resultado
  const enriched: StatusOrder[] = data.map((s) => ({
    ...s,
    next_status_nombre: s.next_status ? mapa.get(s.next_status) ?? null : null,
  }));

  return enriched;
}

// -------- CREATE: calcula max(id_status)+1 dentro de la acción --------

interface CreateStatusInput {
  nombre: string;
  next_status: number | null;
  last_status: boolean;
}

export async function createStatusOrderAction(input: CreateStatusInput) {
  const { nombre, next_status, last_status } = input;

  // 1) Obtener el máximo id_status actual
  const { data: maxRow, error: maxError } = await supabase
    .from("tbl_status_orders")
    .select("id_status")
    .order("id_status", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxError) {
    console.error("Error al obtener max(id_status):", maxError.message);
    throw new Error(maxError.message);
  }

  const nextId =
    maxRow && typeof maxRow.id_status === "number"
      ? maxRow.id_status + 1
      : 1;

  // 2) Insertar con id_status calculado
  const { data, error } = await supabase
    .from("tbl_status_orders")
    .insert([
      {
        id_status: nextId,
        nombre,
        next_status,
        last_status,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error al crear status order:", error.message);
    throw new Error(error.message);
  }

  return data as StatusOrder;
}

// -------- UPDATE: se mantiene igual, solo actualiza por id_status --------

interface UpdateStatusInput {
  id_status: number;
  nombre: string;
  next_status: number | null;
  last_status: boolean;
}

export async function updateStatusOrderAction(input: UpdateStatusInput) {
  const { id_status, nombre, next_status, last_status } = input;

  const { data, error } = await supabase
    .from("tbl_status_orders")
    .update({
      nombre,
      next_status,
      last_status,
    })
    .eq("id_status", Number(id_status))
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar status order:", error.message);
    throw new Error(error.message);
  }

  return data as StatusOrder;
}


export interface StatusFlowRow {
  id_status: number;
  nombre: string;
  next_status: number | null;
  last_status: boolean;
  next_status_nombre?: string | null;
}

// Trae el status actual y el nombre del siguiente status (si existe)
export async function getStatusFlowByIdAction(
  id_status: number
): Promise<StatusFlowRow | null> {
  // 1) Status actual
  const { data: current, error } = await supabase
    .from("tbl_status_orders")
    .select("id_status, nombre, next_status, last_status")
    .eq("id_status", id_status)
    .single();

  if (error) {
    console.error("Error al obtener status actual:", error.message);
    return null;
  }

  let next_status_nombre: string | null = null;

  // 2) Nombre del siguiente status (si está configurado)
  if (current.next_status != null) {
    const { data: nextRow, error: nextError } = await supabase
      .from("tbl_status_orders")
      .select("nombre")
      .eq("id_status", current.next_status)
      .single();

    if (nextError) {
      console.error("Error al obtener nombre del siguiente status:", nextError.message);
    } else {
      next_status_nombre = nextRow?.nombre ?? null;
    }
  }

  return {
    id_status: current.id_status,
    nombre: current.nombre,
    next_status: current.next_status,
    last_status: current.last_status,
    next_status_nombre,
  };
}