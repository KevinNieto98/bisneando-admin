"use client";

import React from "react";
import { Button } from "@/components"; // tu Button con variantes
import { Eraser, PlusCircle, Search } from "lucide-react";

export type Categoria = { id_categoria: number; nombre_categoria: string };

type Props = {
  // estado/control
  query: string;
  status: string;                // "Todos" | "Activos" | "Inactivos"
  selectedCatId: string;         // "" = Todas
  cats: Categoria[];

  // handlers
  onQueryChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onClearFilters: () => void;
  onCreateNew: () => void;
  onResetPage?: () => void;      // opcional para setPage(1)

  className?: string;
};

export  function HeaderTable({
  query,
  status,
  selectedCatId,
  cats,
  onQueryChange,
  onStatusChange,
  onCategoryChange,
  onClearFilters,
  onCreateNew,
  onResetPage,
  className,
}: Props) {
  const resetAnd = (fn: () => void) => {
    fn();
    onResetPage?.();
  };

  return (
    <div className={["mt-2 mb-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3", className].filter(Boolean).join(" ")}>
      {/* Buscador */}
      <div className="sm:col-span-2 md:col-span-2">
        <label htmlFor="filtro-busqueda" className="block text-xs font-medium text-neutral-600 mb-1">
          Búsqueda
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          <input
            id="filtro-busqueda"
            value={query}
            onChange={(e) => resetAnd(() => onQueryChange(e.target.value))}
            placeholder="Buscar por título, marca o slug..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="filtro-categoria" className="block text-xs font-medium text-neutral-600 mb-1">
          Categoría
        </label>
        <select
          id="filtro-categoria"
          value={selectedCatId}
          onChange={(e) => resetAnd(() => onCategoryChange(e.target.value))}
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
        >
          <option value="">Todas</option>
          {cats.map((c) => (
            <option key={c.id_categoria} value={String(c.id_categoria)}>
              {c.nombre_categoria}
            </option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div>
        <label htmlFor="filtro-estado" className="block text-xs font-medium text-neutral-600 mb-1">
          Estado
        </label>
        <select
          id="filtro-estado"
          value={status}
          onChange={(e) => resetAnd(() => onStatusChange(e.target.value))}
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
        >
          <option value="Todos">Todos</option>
          <option value="Activos">Activos</option>
          <option value="Inactivos">Inactivos</option>
        </select>
      </div>

      {/* Botones */}
      <div className="flex items-end gap-2">
        <Button onClick={onClearFilters} variant="danger" className="w-full">
          <Eraser className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
        <Button onClick={onCreateNew} variant="success" className="w-full">
          <PlusCircle className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>
    </div>
  );
}
