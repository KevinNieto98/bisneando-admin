"use client";

import React, { useMemo, useState } from "react";
import { Boxes, Eraser, PlusCircle, Search, XCircle } from "lucide-react";
import { Button, ProductGridItem, Title, UIProduct } from "@/components";
import { initialData } from "@/seed/seed";
import { useRouter } from "next/navigation";

type SeedProduct = (typeof initialData)["products"][number];

const toUIProduct = (p: SeedProduct, idx: number): UIProduct => ({
  id: (p as any).id ?? (p as any)._id ?? idx + 1,
  slug: p.slug,
  title: p.title,
  price: p.price,
  images: p.images ?? [],
  brand: p.brand,
  quantity: p.inStock,
  active: p.isActive,
  category: p.category,
});

export  function PageContent() {

  const router = useRouter();
  const [products, setProducts] = useState<UIProduct[]>(
    initialData.products.map(toUIProduct)
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [status, setStatus] = useState<string>("Todos");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const categories = useMemo(() => {
    const set = new Set<string>(products.map((p) => p.category || "Sin categoría"));
    return ["Todas", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q
        ? true
        : [p.title, p.brand, p.slug]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(q));

      const matchesCategory =
        category === "Todas" || (p.category || "Sin categoría") === category;

      const matchesStatus =
        status === "Todos" ||
        (status === "Activos" && p.active) ||
        (status === "Inactivos" && !p.active);

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, category, status]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleToggleActive = (id: UIProduct["id"], next: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: next } : p))
    );
  };

  const handleClearFilters = () => {
    setQuery("");
    setCategory("Todas");
    setStatus("Todos");
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Title
        title="Inventario" // 👈 ahora dice Inventario
        subtitle="Explora, busca y gestiona tu inventario"
        showBackButton
        backHref="/productos"
        icon={<Boxes className="h-6 w-6 text-neutral-700" />}
      />

      {/* toolbar */}
      <div className="mt-2 mb-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* Buscador */}
        <div className="sm:col-span-2 md:col-span-2">
          <label
            htmlFor="filtro-busqueda"
            className="block text-xs font-medium text-neutral-600 mb-1"
          >
            Búsqueda
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
            <input
              id="filtro-busqueda"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por título, marca o slug..."
              className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label
            htmlFor="filtro-categoria"
            className="block text-xs font-medium text-neutral-600 mb-1"
          >
            Categoría
          </label>
          <select
            id="filtro-categoria"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label
            htmlFor="filtro-estado"
            className="block text-xs font-medium text-neutral-600 mb-1"
          >
            Estado
          </label>
          <select
            id="filtro-estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          >
            <option value="Todos">Todos</option>
            <option value="Activos">Activos</option>
            <option value="Inactivos">Inactivos</option>
          </select>
        </div>

        {/* Botón limpiar */}
        <div className="flex items-end">
          <Button
            onClick={handleClearFilters}
            variant="danger"
            icon={<Eraser className="h-4 w-4" />}
            className="w-full"
          >
            Limpiar
          </Button>
            <Button
            onClick={() => router.push("/productos/new")}
            variant="success"
            icon={<PlusCircle className="mx-1 h-4 w-4" />}
            className="w-full"
          >
            Nuevo
          </Button>
        </div>
      </div>

      {/* grid */}
      {pageSlice.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-600">
          No se encontraron productos con los filtros aplicados.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageSlice.map((p) => (
            <ProductGridItem
              key={p.id}
              product={p}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* paginación */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-neutral-600">
          Mostrando {pageSlice.length} de {total} resultado{total === 1 ? "" : "s"}
        </span>
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
          >
            Anterior
          </button>
          <span>
            Página {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
