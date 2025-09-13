// PageContent.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Boxes, Eraser, PlusCircle, Search } from "lucide-react";
import { Button, ProductGridItem, Title, UIProduct } from "@/components";
import { useRouter } from "next/navigation";
import {
  getProductosConImagenesAction,
  ProductoConImagenes,
  updateProductoActivoAction,
  getCategoriasActivasAction,
} from "../../actions"; // 👈 asegúrate que exportas getCategoriasActivasAction

const toUIProduct = (p: ProductoConImagenes): UIProduct => ({
  id: p.id_producto,
  slug: p.slug,
  title: p.nombre_producto,
  price: p.precio,
  images: (p.imagenes ?? []).map((i) => i.url_imagen),
  brand: String(p.id_marca ?? ""),
  quantity: p.qty,
  active: p.is_active,
  category: String(p.id_categoria), // mantenemos el id_categoria en string
});

export function PageContent() {
  const router = useRouter();

  const [products, setProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("Todos");
  const [page, setPage] = useState(1);

  // --- categorías ---
  const [cats, setCats] = useState<{ id_categoria: number; nombre_categoria: string }[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>(""); // "" = Todas

  const pageSize = 12;

  // ---- cargar productos desde Supabase
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await getProductosConImagenesAction();
        if (!alive) return;
        setProducts((data ?? []).map(toUIProduct));
      } catch (err: any) {
        if (!alive) return;
        console.error(err);
        setLoadError(err?.message ?? "No se pudieron cargar los productos.");
        setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- cargar categorías activas ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getCategoriasActivasAction();
        if (!alive) return;
        setCats(data ?? []);
      } catch (err) {
        console.error(err);
        setCats([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- filtros en cliente ----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q
        ? true
        : [p.title, p.brand, p.slug]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(q));

      const matchesCategory =
        selectedCatId === "" || String(p.category) === selectedCatId;

      const matchesStatus =
        status === "Todos" ||
        (status === "Activos" && p.active) ||
        (status === "Inactivos" && !p.active);

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, selectedCatId, status]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  // ---- toggle active ----
  const handleToggleActive = async (id: UIProduct["id"], next: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: next } : p))
    );
    try {
      await updateProductoActivoAction(Number(id), next);
    } catch (err: any) {
      console.error(err);
      // rollback
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !next } : p))
      );
    }
  };

  const handleClearFilters = () => {
    setQuery("");
    setSelectedCatId("");
    setStatus("Todos");
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Title
        title="Inventario"
        subtitle="Explora, busca y gestiona tu inventario"
        showBackButton
        backHref="/productos"
        icon={<Boxes className="h-6 w-6 text-neutral-700" />}
      />

      {/* estados de carga/errores */}
      {loading && (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-600">
          Cargando productos…
        </div>
      )}
      {loadError && !loading && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* toolbar */}
      {!loading && !loadError && (
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
              value={selectedCatId}
              onChange={(e) => {
                setSelectedCatId(e.target.value);
                setPage(1);
              }}
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

          {/* Botones */}
          <div className="flex items-end gap-2">
            <Button
              onClick={handleClearFilters}
              variant="danger"
              className="w-full"
            >
              <Eraser className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
            <Button
              onClick={() => router.push("/productos/new")}
              variant="success"
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </div>
        </div>
      )}

      {/* grid */}
      {!loading && !loadError && (
        pageSlice.length === 0 ? (
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
        )
      )}

      {/* paginación */}
      {!loading && !loadError && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Mostrando {pageSlice.length} de {total} resultado
            {total === 1 ? "" : "s"}
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
      )}
    </div>
  );
}
