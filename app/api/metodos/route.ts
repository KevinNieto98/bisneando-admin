// app/api/metodos/route.ts
import { getMetodosAction } from "@/app/(admin)/mantenimiento/metodo-pago/actions";
import { NextResponse } from "next/server";

// evita caché en Vercel/Next
export const dynamic = "force-dynamic";

type MetodoPago = {
  id_metodo: number;
  nombre?: string;
  // cualquier otro campo...
  activo?: boolean;
  is_active?: boolean;
  enabled?: boolean;
  status?: string;   // "active" | "inactive" | ...
  estado?: string;   // "activo" | "inactivo" | ...
  active?: number;   // 1/0
};

const esActivo = (m: MetodoPago): boolean => {
  if (typeof m.activo === "boolean") return m.activo;
  if (typeof m.is_active === "boolean") return m.is_active;
  if (typeof m.enabled === "boolean") return m.enabled;
  if (typeof m.active === "number") return m.active === 1;

  if (typeof m.status === "string") {
    const s = m.status.toLowerCase();
    if (s === "active" || s === "enabled") return true;
    if (s === "inactive" || s === "disabled") return false;
  }

  if (typeof m.estado === "string") {
    const e = m.estado.toLowerCase();
    if (e === "activo" || e === "habilitado") return true;
    if (e === "inactivo" || e === "deshabilitado") return false;
  }

  // Si no encontramos un flag claro, por seguridad NO lo exponemos
  return false;
};

export async function GET() {
  try {
    const metodos = (await getMetodosAction()) as MetodoPago[];

    const activos = Array.isArray(metodos)
      ? metodos.filter(esActivo)
      : [];

    return NextResponse.json(
      { ok: true, items: activos },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err: any) {
    console.error("API /api/metodos error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}
