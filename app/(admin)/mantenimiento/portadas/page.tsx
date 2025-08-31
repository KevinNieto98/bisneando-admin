"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, Pencil, Plus, Search } from "lucide-react";
import { Switch, Table, Title } from "@/components";

// Si tu módulo "@/components" exporta el tipo Column, usa esta línea:
// import { Table, Title, type Column } from "@/components";

// Si NO exportas Column desde "@/components", deja este tipo local:
type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

// Tipos
interface MetodoPago {
  id_metodo_pago: number;
  direccion: string;
  disponible: boolean;
  portadaFile: string; // archivo en /public/portadas
}

// Datos de ejemplo (reemplazar con fetch/DB)
const initialData: MetodoPago[] = [
  { id_metodo_pago: 1, direccion: "/productos", disponible: true,  portadaFile: "1.png" },
  { id_metodo_pago: 2, direccion: "/productos/iphone-13-pro", disponible: true, portadaFile: "2.png" },
  { id_metodo_pago: 3, direccion: "/productos/samsung-galaxy-s22", disponible: false, portadaFile: "3.png" },
];

// Mini preview rectangular con fallback
function CoverThumb({ file }: { file: string }) {
  const [error, setError] = React.useState(false);

  return (
    <div className="relative w-36 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
      {/* Rectángulo 16:9 */}
      <div className="pt-[56.25%]" />
      <div className="absolute inset-0">
        {!error ? (
          <Image
            src={`/portadas/${file}`}
            alt={`Portada ${file}`}
            fill
            sizes="144px"
            className="object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
            No disponible
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetodosPagoPage() {
  const router = useRouter();
  const [data, setData] = useState<MetodoPago[]>(initialData);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((m) =>
      [m.id_metodo_pago.toString(), m.direccion.toLowerCase(), m.portadaFile.toLowerCase()].some((s) =>
        s.includes(q)
      )
    );
  }, [data, query]);

  const handleToggleDisponible = (id: number, next?: boolean) => {
    setData((prev) =>
      prev.map((m) =>
        m.id_metodo_pago === id
          ? { ...m, disponible: typeof next === "boolean" ? next : !m.disponible }
          : m
      )
    );
  };

  // ⬇️ ORDEN: ID → Portada → Dirección → Disponible
  const columns: Column<MetodoPago>[] = [
    {
      header: "ID",
      className: "w-16 text-center",
      align: "center",
      cell: (row) => row.id_metodo_pago,
    },
    {
      header: "Portada",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center">
          <CoverThumb file={row.portadaFile} />
        </div>
      ),
    },
    {
      header: "Dirección",
      className: "min-w-[280px] w-[40%] text-left",
      align: "left",
      cell: (row) => (
        <div className="max-w-[560px]">
          <code
            className="rounded bg-neutral-100 px-2 py-1 text-[12px] text-neutral-800 block truncate"
            title={row.direccion}
          >
            {row.direccion}
          </code>
        </div>
      ),
    },
    {
      header: "Disponible",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={row.disponible}
            onChange={(next) => handleToggleDisponible(row.id_metodo_pago, next)}
            ariaLabel={`Cambiar disponibilidad de ${row.direccion}`}
          />
          <span className="text-xs font-medium text-neutral-700">
            {row.disponible ? "Sí" : "No"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header */}
      <Title
        showBackButton
        backHref="/mantenimiento"
        title="Portadas"
        icon={<ImageIcon className="w-6 h-6 text-neutral-900" />}
        subtitle="Gestiona las portadas del carrusel"
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          {/* Crear -> /portadas/new */}
          <button
            onClick={() => router.push("/mantenimiento/portadas/new")}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Nueva portada
          </button>
        </div>
      </div>

      {/* Tabla */}
      <Table
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id_metodo_pago}
        actions={(row: MetodoPago) => (
          <>
            {/* Editar -> /portadas/[id] */}
            <button
              onClick={() => router.push(`/mantenimiento/portadas/${row.id_metodo_pago}`)}
              className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
              aria-label="Editar portada"
              title="Editar portada"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </>
        )}
        actionsHeader="Acciones"
        ariaLabel="Tabla de portadas"
      />
    </div>
  );
}

// Utilidad (si la necesitas)
function nextId(arr: MetodoPago[]) {
  return (
    (arr.reduce((max, m) => (m.id_metodo_pago > max ? m.id_metodo_pago : max), 0) || 0) + 1
  );
}
