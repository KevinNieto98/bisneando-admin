"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileSpreadsheet, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Title } from "@/components";
import { initialData } from "@/seed/seed";

type PendingProduct = {
  id: string | number;
  title: string;
  price: number;
  images: string[];
  brand?: string;
  quantity: number;
  category?: string;
  selected?: boolean; // puede venir undefined desde Excel
};

// -------- helpers de imagen ----------
const defaultSrc = "/not_available.png";
const resolveSrc = (nameOrPath: string) => {
  if (!nameOrPath) return defaultSrc;
  if (nameOrPath.startsWith("/") || nameOrPath.startsWith("http")) return nameOrPath;
  return `/products/${nameOrPath}`;
};
// -------------------------------------

// Demo: convierte tu seed a “pendientes”
const pendingSeed: PendingProduct[] = initialData.products.map((p, idx) => ({
  id: (p as any).id_producto ?? (p as any).id ?? idx + 1,
  title: p.title,
  price: p.price,
  images: p.images ?? [],
  brand: p.brand,
  quantity: p.inStock ?? 0,
  category: p.category,
  selected: false,
}));

export default function ProductosPendientesPage() {
  const [rows, setRows] = useState<PendingProduct[]>(pendingSeed);

  const stats = useMemo(() => {
    const seleccionados = rows.filter((r) => !!r.selected).length;
    return { seleccionados, total: rows.length };
  }, [rows]);

  const toggleSeleccion = (id: PendingProduct["id"], next?: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: next ?? !r.selected } : r))
    );
  };

  const marcarTodos = (next: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: next })));
  };

  const procesarAprobaciones = () => {
    const aprobados = rows.filter((r) => !!r.selected);
    if (!aprobados.length) {
      alert("Selecciona al menos un producto para aprobar.");
      return;
    }
    
    setRows((prev) => prev.filter((r) => !r.selected)); // opcional
  };

  const procesarRechazos = () => {
    const rechazados = rows.filter((r) => !!r.selected);
    if (!rechazados.length) {
      alert("Selecciona al menos un producto para rechazar.");
      return;
    }
    setRows((prev) => prev.filter((r) => !r.selected)); // opcional
  };

  const resetear = () => marcarTodos(false);

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Title
        title="Pendientes"
        subtitle="Importa tu excel con productos"
        showBackButton
        backHref="/productos"
        icon={<FileSpreadsheet className="h-6 w-6 text-neutral-700" />}
      />

      {/* Toolbar */}
      <div className="mt-3 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-neutral-600">
          Total: <span className="font-semibold text-neutral-800">{stats.total}</span> ·{" "}
          Seleccionados: <span className="font-semibold">{stats.seleccionados}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => marcarTodos(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            title="Seleccionar todos"
          >
            Seleccionar todos
          </button>
          <button
            onClick={() => marcarTodos(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            title="Deseleccionar todos"
          >
            Deseleccionar todos
          </button>
          <button
            onClick={resetear}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            title="Reiniciar selección"
          >
            <RotateCcw className="w-4 h-4" />
            Resetear
          </button>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={procesarAprobaciones}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed"
          disabled={stats.seleccionados === 0}
        >
          <CheckCircle2 className="w-4 h-4" />
          Aprobar seleccionados ({stats.seleccionados})
        </button>

        <button
          onClick={procesarRechazos}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          disabled={stats.seleccionados === 0}
        >
          <XCircle className="w-4 h-4" />
          Rechazar seleccionados ({stats.seleccionados})
        </button>
      </div>

      {/* Tabla */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-600">
          No hay productos pendientes.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-700">
              <tr>
                {/* ✅ sin ancho fijo, y sin truncar texto */}
                <th className="px-3 py-2 text-left whitespace-nowrap">Seleccionar</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Precio</th>
                <th className="px-3 py-2 text-left">Stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const first = r.images?.[0];
                const imgSrc = first ? resolveSrc(first) : defaultSrc;

                return (
                  <tr key={r.id} className="border-t last:border-b">
                    {/* Seleccionar */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!r.selected}              // ✅ siempre boolean
                          onChange={(e) => toggleSeleccion(r.id, e.currentTarget.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-xs text-neutral-700">Seleccionar</span>
                      </label>
                    </td>

                    {/* Producto (thumb + nombre + marca + link a productos/[id]) */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt={r.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = defaultSrc;
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/productos/${r.id}`}
                            className="line-clamp-2 font-medium text-neutral-900 hover:text-blue-600"
                            title="Ir al detalle"
                          >
                            {r.title}
                          </Link>
                          {r.brand && (
                            <div className="text-xs text-neutral-500">{r.brand}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Precio */}
                    <td className="px-3 py-3 font-semibold text-neutral-800">
                      {new Intl.NumberFormat("es-HN", {
                        style: "currency",
                        currency: "HNL",
                      }).format(r.price)}
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-3 text-neutral-700">{r.quantity}</td>

   
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
