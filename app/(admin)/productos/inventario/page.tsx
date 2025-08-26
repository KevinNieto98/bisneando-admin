// /app/productos/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Boxes, Search } from "lucide-react";
import { ProductGridItem, Title, UIProduct } from "@/components"; // ajusta si es otra ruta

import { initialData } from "@/seed/seed";

// importa tu seed tal cual la compartiste
// p. ej. /seed/initialData.ts

// Tipos del seed (si los exportas, impórtalos; si no, infiérelo del objeto)
type SeedProduct = (typeof initialData)["products"][number];

// Adaptador: SeedProduct -> UIProduct
const toUIProduct = (p: SeedProduct): UIProduct => ({
  slug: p.slug,
  title: p.title,
  price: p.price,
  images: p.images ?? [],
  brand: p.brand,
  quantity: p.inStock,
  active: p.isActive,
  category: p.category,
});

export default function ProductosPage() {
  // Carga inicial desde seed adaptando a la UI
  const [products, setProducts] = useState<UIProduct[]>(
    initialData.products.map(toUIProduct)
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // categorías únicas (desde seed.category)
  const categories = useMemo(() => {
    const set = new Set<string>(products.map((p) => p.category || "Sin categoría"));
    return ["Todas", ...Array.from(set)];
  }, [products]);

  // filtro texto + categoría (incluye brand y slug; si quieres, agrega tags del seed)
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
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  // paginación
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  // toggle activo/inactivo
  const handleToggleActive = (slug: string, next: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, active: next } : p))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Title
        title="Productos"
        subtitle="Explora, busca y gestiona tus productos"
        showBackButton
        backHref="/"
        icon={<Boxes className="h-6 w-6 text-neutral-700" />}
      />

      {/* toolbar: buscador + categorías */}
      <div className="mt-2 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por título, marca o slug..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div>
          <select
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
              key={p.slug}
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
