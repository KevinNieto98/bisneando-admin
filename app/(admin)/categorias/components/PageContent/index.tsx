"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tags, Search, Info } from "lucide-react";
import {
  Alert,
  Modal,
  Table,
  Title,
  Switch,
  Icono,
  ModalSkeleton,
  TableSkeleton,
  Pagination,
} from "@/components";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { useUIStore } from "@/store";
import { Categoria, CategoriaForm } from "../CategoriaForm";
import { getCategoriasAction, postCategoriasAction, putCategoriasAction } from "../../actions";
import { clampPage, ensureIcon, filterCategorias, nextId, slicePage,   totalPages as getTotalPages,  } from "../../utils";
import { FooterModal } from "../FooterModal";

// Fallback local (por si no hay datos)
const initialData: Categoria[] = [
  { id_categoria: 1, nombre_categoria: "Electrónica", activa: true, icono: "Cpu" },
  { id_categoria: 2, nombre_categoria: "Hogar", activa: true, icono: "Home" },
  { id_categoria: 3, nombre_categoria: "Ropa", activa: false, icono: "Shirt" },
];

type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

export  function PageContent() {
  const [data, setData] = useState<Categoria[]>(initialData);
  const [query, setQuery] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // UI store
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  // Modal & envío
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formId = "categoria-form";

  // Paginación
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const categorias = await getCategoriasAction();
        if (Array.isArray(categorias) && categorias.length > 0) {
          setData(categorias);
        }
      } catch (e) {
        console.error("Error al cargar categorías:", e);
        mostrarAlerta("Error", "No se pudieron cargar las categorías.", "danger");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [mostrarAlerta]);

  useEffect(() => {
    setModalLoading(open);
  }, [open]);

  // Filtrado + paginado
  const filtered = useMemo(() => filterCategorias(data, query), [data, query]);
  const pages = useMemo(() => getTotalPages(filtered.length, PAGE_SIZE), [filtered.length]);
  const safePage = clampPage(currentPage, pages);
  const paginatedData = useMemo(
    () => slicePage(filtered, safePage, PAGE_SIZE),
    [filtered, safePage],
  );

  // Handlers
  const handleCreate = () => {
    setOpen(true);
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({
        id_categoria: nextId(data),
        nombre_categoria: "",
        activa: true,
        icono: ensureIcon(null),
      });
    }, 0);
  };

  const handleEdit = (c: Categoria) => {
    setOpen(true);
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({ ...c });
    }, 0);
  };

  const handleToggleActiva = async (id: number, next?: boolean) => {
    // Optimistic
    setData((prev) =>
      prev.map((c) =>
        c.id_categoria === id
          ? { ...c, activa: typeof next === "boolean" ? next : !c.activa }
          : c
      )
    );

    try {
      const cat = data.find((c) => c.id_categoria === id);
      if (!cat) return;
      const nuevaActiva = typeof next === "boolean" ? next : !cat.activa;

      const updated = await putCategoriasAction(
        id,
        cat.nombre_categoria,
        nuevaActiva,
        cat.icono ?? null
      );

      // Reconciliar
      setData((prev) =>
        prev.map((c) =>
          c.id_categoria === updated.id_categoria
            ? {
                id_categoria: updated.id_categoria,
                nombre_categoria: updated.nombre_categoria,
                activa: updated.is_active,
                icono: updated.icono ?? null,
              }
            : c
        )
      );
    } catch (e) {
      console.error("Error al actualizar estado:", e);
      mostrarAlerta("Error", "No se pudo actualizar el estado.", "danger");
      // rollback
      setData((prev) =>
        prev.map((c) =>
          c.id_categoria === id ? { ...c, activa: !c.activa } : c
        )
      );
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    const exists = data.some((c) => c.id_categoria === editing.id_categoria);

    openConfirm({
      titulo: exists ? "Confirmar actualización" : "Confirmar creación",
      mensaje: exists
        ? `¿Deseas actualizar la categoría "${editing.nombre_categoria}"?`
        : `¿Deseas crear la categoría "${editing.nombre_categoria}"?`,
      confirmText: exists ? "Actualizar" : "Crear",
      rejectText: "Cancelar",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          await doSave({ exists });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const doSave = async ({ exists }: { exists: boolean }) => {
    try {
      if (exists) {
        const updated = await putCategoriasAction(
          editing!.id_categoria,
          editing!.nombre_categoria,
          editing!.activa,
          editing!.icono ?? null
        );

        setData((prev) =>
          prev.map((c) =>
            c.id_categoria === updated.id_categoria
              ? {
                  id_categoria: updated.id_categoria,
                  nombre_categoria: updated.nombre_categoria,
                  activa: updated.is_active,
                  icono: updated.icono ?? null,
                }
              : c
          )
        );
      } else {
        const created = await postCategoriasAction(
          editing!.nombre_categoria,
          editing!.activa,
          ensureIcon(editing!.icono)
        );

        setData((prev) => [
          ...prev,
          {
            id_categoria: created.id_categoria,
            nombre_categoria: created.nombre_categoria,
            activa: created.is_active,
            icono: created.icono,
          },
        ]);
      }

      setOpen(false);
      setEditing(null);

      mostrarAlerta(
        "¡Guardado!",
        exists ? "La categoría se actualizó correctamente." : "La categoría se creó correctamente.",
        "success"
      );

      setCurrentPage(1);
    } catch (e) {
      console.error("Error al guardar categoría:", e);
      mostrarAlerta("Error", "No se pudo guardar la categoría. Intenta de nuevo.", "danger");
    }
  };

  // Columnas
  const columns: Column<Categoria>[] = [
    { header: "ID", className: "w-16 text-center", align: "center", cell: (row) => row.id_categoria },
    {
      header: "Icono",
      className: "w-24 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100">
            <Icono name={row.icono ?? undefined} size={16} />
          </span>
        </div>
      ),
    },
    {
      header: "Nombre",
      className: "min-w-[220px] w-full text-left",
      align: "left",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">{row.nombre_categoria}</span>
        </div>
      ),
    },
    {
      header: "Estado",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={row.activa}
            onChange={(next) => handleToggleActiva(row.id_categoria, next)}
            ariaLabel={`Cambiar estado de ${row.nombre_categoria}`}
          />
          <span
            className={`text-xs font-medium ${
              row.activa ? "text-emerald-700" : "text-neutral-600"
            }`}
            title={row.activa ? "Visible para los usuarios" : "Oculta para los usuarios"}
          >
            {row.activa ? "Activa" : "Inactiva"}
          </span>
        </div>
      ),
    },
  ];

  const hasNoResults = !initialLoading && filtered.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Alert />

      <Title
        title="Categorías"
        subtitle="Catálogo de Categorías"
        showBackButton
        backHref="/"
        icon={<Tags className="h-6 w-6 text-neutral-700" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar categoría..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        {/* Contadores */}
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
            Total: <strong className="text-neutral-900">{data.length}</strong>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
            Coincidencias: <strong className="text-neutral-900">{filtered.length}</strong>
          </span>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          disabled={submitting}
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      {/* Tabla o estado vacío */}
      {initialLoading ? (
        <TableSkeleton rows={10} showActions />
      ) : hasNoResults ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <Info className="h-6 w-6 text-neutral-500" />
          <div className="text-sm text-neutral-600">
            No hay resultados para <span className="font-semibold text-neutral-900">“{query}”</span>.
          </div>
          <div className="text-xs text-neutral-500">Prueba con otro término o limpia la búsqueda.</div>
        </div>
      ) : (
        <div className={submitting ? "pointer-events-none opacity-60" : ""}>
          <Table
            data={paginatedData}
            columns={columns}
            getRowId={(row) => row.id_categoria}
            actions={(row: Categoria) => (
              <button
                onClick={() => handleEdit(row)}
                className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-60"
                aria-label="Editar"
                disabled={submitting}
                title="Editar categoría"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            actionsHeader="Acciones"
            ariaLabel="Tabla de categorías"
          />
        </div>
      )}

      {/* Paginación */}
      {!( !initialLoading && filtered.length === 0 ) && (
        <div className="mt-2 flex justify-center">
          <Pagination
            totalPages={pages}
            currentPage={safePage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modal */}
      <Modal
        open={open}
        size="xl"
        onClose={() => {
          if (submitting) return;
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        icon={<Tags className="w-5 h-5" />}
        content={
          editing === null ? (
            <ModalSkeleton />
          ) : (
            <>
              {(modalLoading || submitting) && <ModalSkeleton />}
              <div className={(modalLoading || submitting) ? "pointer-events-none opacity-60" : ""}>
                <CategoriaForm
                  value={editing}
                  onChange={setEditing}
                  onSubmit={handleSave}
                  formId={formId}
                  onReady={() => setModalLoading(false)}
                  disabled={submitting}
                />
              </div>
            </>
          )
        }
        footer={
          <FooterModal
            formId={formId}
            onCancel={() => { if (!submitting) { setOpen(false); setEditing(null); } }}
            disabled={submitting}
          />
        }
      />

      {/* Confirm global */}
      <ConfirmDialog />
    </div>
  );
}
