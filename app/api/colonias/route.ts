// app/api/colonias/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    return NextResponse.json(
      { error: "Faltan variables de entorno de Supabase" },
      { status: 500 }
    );
  }

  const url =
    `${base}/rest/v1/tbl_colonias` +
    `?select=id_colonia,nombre_colonia,is_active,tiene_cobertura,referencia,updated_at` +
    `&is_active.eq.true&tiene_cobertura.eq.true` +
    `&order=id_colonia.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
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
