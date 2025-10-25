// app/api/colonias/route.ts
import { NextResponse } from "next/server";

const ALLOWED_ORDER_BY = new Set<"id_colonia" | "nombre_colonia" | "updated_at">([
  "id_colonia",
  "nombre_colonia",
  "updated_at",
]);

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    return NextResponse.json(
      { error: "Faltan variables de entorno de Supabase" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);

  // QS desde el cliente
  const rawSearch = searchParams.get("search")?.trim() || "";
  const limit = Number(searchParams.get("limit"));
  const offset = Number(searchParams.get("offset"));
  const orderByRaw = (searchParams.get("orderBy") || "id_colonia") as
    | "id_colonia"
    | "nombre_colonia"
    | "updated_at";
  const orderDirRaw = (searchParams.get("orderDir") || "asc").toLowerCase();

  const orderBy = ALLOWED_ORDER_BY.has(orderByRaw) ? orderByRaw : "id_colonia";
  const orderDir = orderDirRaw === "desc" ? "desc" : "asc";

  // Construir QS para PostgREST
  const qs = new URLSearchParams();
  qs.set(
    "select",
    "id_colonia,nombre_colonia,is_active,tiene_cobertura,referencia,updated_at"
  );
  // ✅ filtros correctos de booleanos
  qs.set("is_active", "eq.true");
  qs.set("tiene_cobertura", "eq.true");
  qs.set("order", `${orderBy}.${orderDir}`);

  if (!Number.isNaN(limit)) qs.set("limit", String(limit));
  if (!Number.isNaN(offset)) qs.set("offset", String(offset));

  if (rawSearch) {
    // búsqueda case-insensitive por contiene
    // limpieza básica para evitar comodines raros
    const cleaned = rawSearch.replace(/[%*]/g, "").replace(/\s+/g, " ");
    qs.set("nombre_colonia", `ilike.*${cleaned}*`);
  }

  const url = `${base}/rest/v1/tbl_colonias?${qs.toString()}`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      // Si luego quieres total para paginación con Range, añade:
      // Prefer: "count=exact"
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
