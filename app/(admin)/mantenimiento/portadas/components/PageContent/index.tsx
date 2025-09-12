"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Pencil, Plus, Search } from "lucide-react";
import { Switch, Table, Title, Alert, TableSkeleton, Button } from "@/components";
import { useUIStore } from "@/store";
import { getAllPortadasAction } from "../../actions";

// Si NO exportas Column desde "@/components", usa este tipo local:
type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

// Tipos que vienen del server action (simplificados para la UI)
interface PortadaItem {
  id_portada: number;
  url_imagen: string | null;
  link: string;
  is_active: boolean;
  fecha_creacion: string;
  usuario_crea: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
}

// Mini preview rectangular con fallback
function CoverThumb({ url }: { url: string | null }) {
  const [error, setError] = React.useState(false);

  return (
    <div className="relative w-36 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
      {/* Rectángulo 16:9 */}
      <div className="pt-[56.25%]" />
      <div className="absolute inset-0">
        {url && !error ? (
          // Usamos <img> para evitar configurar domains en next/image
          <img
            src={url}
            alt="Portada"
            className="h-full w-full object-cover"
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

export  function PageContent() {
  const router = useRouter();
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);

  const [rows, setRows] = useState<PortadaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState("");

  // Cargar desde Supabase (server action)
  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllPortadasAction({
        offset: 0,
        limit: 200,      // ajusta si esperas muchas
        onlyActive: false,
        orderBy: "fecha_creacion",
        ascending: false,
      });

      if (!res.ok) {
        mostrarAlerta("Error", res.message || "No se pudieron obtener las portadas", "danger");
        setRows([]);
        return;
      }

      setRows(res.data ?? []);
    } catch (err: any) {
      mostrarAlerta("Error", err?.message || "Error inesperado obteniendo portadas", "danger");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtro local por id/link/url
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((m) =>
      [
        m.id_portada.toString(),
        m.link?.toLowerCase() ?? "",
        m.url_imagen?.toLowerCase() ?? "",
      ].some((s) => s.includes(q))
    );
  }, [rows, query]);

  // Toggle local (no persiste)
  const handleToggleDisponible = (id: number, next?: boolean) => {
    setRows((prev) =>
      prev.map((m) =>
        m.id_portada === id
          ? { ...m, is_active: typeof next === "boolean" ? next : !m.is_active }
          : m
      )
    );
    // Si quieres persistir aquí, llama updatePortadaAction(id, null, m.link, next!)
  };

  // Columnas: ID → Portada → Dirección → Disponible
  const columns: Column<PortadaItem>[] = [
    {
      header: "ID",
      className: "w-16 text-center",
      align: "center",
      cell: (row) => row.id_portada,
    },
    {
      header: "Portada",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center">
          <CoverThumb url={row.url_imagen} />
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
            title={row.link}
          >
            {row.link}
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
            checked={row.is_active}
            onChange={(next) => handleToggleDisponible(row.id_portada, next)}
            ariaLabel={`Cambiar disponibilidad de ${row.link}`}
          />
          <span className="text-xs font-medium text-neutral-700">
            {row.is_active ? "Sí" : "No"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Alert />

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
            placeholder="Buscar por id, link o url..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="success"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => router.push("/mantenimiento/portadas/new")}
          >
            Nueva portada
          </Button>
        </div>
      </div>

      {/* Tabla / Estado de carga */}
      {loading ? (
        <TableSkeleton rows={4} showActions />
      ) : (
        <Table
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id_portada}
          actions={(row: PortadaItem) => (
            <>
              {/* Editar -> /mantenimiento/portadas/[id] */}
              <button
                onClick={() => router.push(`/mantenimiento/portadas/${row.id_portada}`)}
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
      )}
    </div>
  );
}
