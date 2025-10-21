"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, MapPin, Search, Info } from "lucide-react";
import {
  Alert,
  Modal,
  Table,
  Title,
  Switch,
  ModalSkeleton,
  TableSkeleton,
  Pagination,
} from "@/components";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUIStore } from "@/store";

import { Colonia, ColoniaForm } from "../ColoniaForm";
import {
  getColoniasAction,
  postColoniasAction,
  putColoniasAction,
} from "../../actions";
import { clampPage, slicePage, totalPages as getTotalPages } from "../../utils";
import { FooterModal } from "../FooterModal";

type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

export function PageContent() {
  const [data, setData] = useState<Colonia[]>([]);
  const [query, setQuery] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Colonia | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formId = "colonia-form";

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const colonias = await getColoniasAction();
        if (Array.isArray(colonias)) setData(colonias);
      } catch (e) {
        console.error("Error al cargar colonias:", e);
        mostrarAlerta("Error", "No se pudieron cargar las colonias.", "danger");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [mostrarAlerta]);

  useEffect(() => {
    setModalLoading(open);
  }, [open]);

  // Filtrado + paginado
  const filterColonias = (rows: Colonia[], q: string) =>
    q.trim().length === 0
      ? rows
      : rows.filter((r) => r.nombre_colonia.toLowerCase().includes(q.toLowerCase()));

  const filtered = useMemo(() => filterColonias(data, query), [data, query]);
  const pages = useMemo(() => getTotalPages(filtered.length, PAGE_SIZE), [filtered.length]);
  const safePage = clampPage(currentPage, pages);
  const paginatedData = useMemo(
    () => slicePage(filtered, safePage, PAGE_SIZE),
    [filtered, safePage]
  );

  // Handlers
  const handleCreate = () => {
    setOpen(true);
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({
        id_colonia: -1, // temporal; la DB asigna el real al crear
        nombre_colonia: "",
        activa: true,
        tiene_cobertura: false,
        referencia: null,
      });
    }, 0);
  };

  const handleEdit = (c: Colonia) => {
    setOpen(true);
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => setEditing({ ...c }), 0);
  };

  // ✅ Cambiar cobertura (switch en la tabla)
  const handleToggleCobertura = async (id: number, next?: boolean) => {
    // Optimistic
    setData((prev) =>
      prev.map((c) =>
        c.id_colonia === id
          ? { ...c, tiene_cobertura: typeof next === "boolean" ? next : !c.tiene_cobertura }
          : c
      )
    );

    try {
      const col = data.find((c) => c.id_colonia === id);
      if (!col) return;
      const nuevaCobertura = typeof next === "boolean" ? next : !col.tiene_cobertura;

      const updated = await putColoniasAction(
        id,
        col.nombre_colonia,
        col.activa,             // mantenemos el estado actual
        nuevaCobertura,         // actualizamos cobertura
        col.referencia ?? null
      );

      // Reconciliar
      setData((prev) =>
        prev.map((c) =>
          c.id_colonia === updated.id_colonia
            ? {
                id_colonia: updated.id_colonia,
                nombre_colonia: updated.nombre_colonia,
                activa: updated.is_active,
                tiene_cobertura: updated.tiene_cobertura,
                referencia: updated.referencia,
              }
            : c
        )
      );
    } catch (e) {
      console.error("Error al actualizar cobertura:", e);
      mostrarAlerta("Error", "No se pudo actualizar la cobertura.", "danger");
      // rollback
      setData((prev) =>
        prev.map((c) =>
          c.id_colonia === id ? { ...c, tiene_cobertura: !c.tiene_cobertura } : c
        )
      );
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    const exists = editing.id_colonia !== -1 && data.some((c) => c.id_colonia === editing.id_colonia);

    openConfirm({
      titulo: exists ? "Confirmar actualización" : "Confirmar creación",
      mensaje: exists
        ? `¿Deseas actualizar la colonia "${editing.nombre_colonia}"?`
        : `¿Deseas crear la colonia "${editing.nombre_colonia}"?`,
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
        const u = await putColoniasAction(
          editing!.id_colonia,
          editing!.nombre_colonia,
          editing!.activa,
          editing!.tiene_cobertura,
          editing!.referencia ?? null
        );

        setData((prev) =>
          prev.map((c) =>
            c.id_colonia === u.id_colonia
              ? {
                  id_colonia: u.id_colonia,
                  nombre_colonia: u.nombre_colonia,
                  activa: u.is_active,
                  tiene_cobertura: u.tiene_cobertura,
                  referencia: u.referencia,
                }
              : c
          )
        );
      } else {
        const created = await postColoniasAction(
          editing!.nombre_colonia,
          editing!.activa,
          editing!.tiene_cobertura,
          editing!.referencia ?? null
        );

        setData((prev) => [
          ...prev,
          {
            id_colonia: created.id_colonia,
            nombre_colonia: created.nombre_colonia,
            activa: created.is_active,
            tiene_cobertura: created.tiene_cobertura,
            referencia: created.referencia,
          },
        ]);
      }

      setOpen(false);
      setEditing(null);

      useUIStore.getState().mostrarAlerta(
        "¡Guardado!",
        exists ? "La colonia se actualizó correctamente." : "La colonia se creó correctamente.",
        "success"
      );

      setCurrentPage(1);
    } catch (e) {
      console.error("Error al guardar colonia:", e);
      mostrarAlerta("Error", "No se pudo guardar la colonia. Intenta de nuevo.", "danger");
    }
  };

  // Columnas (Estado solo como badge; Cobertura es el switch)
  const columns: Column<Colonia>[] = [
    { header: "ID", className: "w-16 text-center", align: "center", cell: (row) => row.id_colonia },
    {
      header: "Nombre",
      className: "min-w-[220px] w-full text-left",
      align: "left",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">{row.nombre_colonia}</span>
        </div>
      ),
    },
    {
      header: "Estado",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <span
          className={`text-xs font-medium ${
            row.activa ? "text-emerald-700" : "text-neutral-600"
          }`}
          title={row.activa ? "Visible" : "Oculta"}
        >
          {row.activa ? "Activa" : "Inactiva"}
        </span>
      ),
    },
    {
      header: "Cobertura",
      className: "w-48 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={row.tiene_cobertura}
            onChange={(next) => handleToggleCobertura(row.id_colonia, next)}
            ariaLabel={`Cambiar cobertura de ${row.nombre_colonia}`}
          />
          <span
            className={`text-xs font-medium ${
              row.tiene_cobertura ? "text-emerald-700" : "text-neutral-600"
            }`}
            title={row.tiene_cobertura ? "Tiene cobertura" : "Sin cobertura"}
          >
            {row.tiene_cobertura ? "Con cobertura" : "Sin cobertura"}
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
        title="Colonias"
        subtitle="Catálogo de Colonias"
        showBackButton
        backHref="/"
        icon={<MapPin className="h-6 w-6 text-neutral-700" />}
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
            placeholder="Buscar colonia..."
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
          Nueva colonia
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
            getRowId={(row) => row.id_colonia}
            actions={(row: Colonia) => (
              <button
                onClick={() => handleEdit(row)}
                className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-60"
                aria-label="Editar"
                disabled={submitting}
                title="Editar colonia"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            actionsHeader="Acciones"
            ariaLabel="Tabla de colonias"
          />
        </div>
      )}

      {/* Paginación */}
      {!hasNoResults && (
        <div className="mt-2 flex justify-center">
          <Pagination totalPages={pages} currentPage={safePage} onPageChange={setCurrentPage} />
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
        title={editing ? "Editar colonia" : "Nueva colonia"}
        icon={<MapPin className="w-5 h-5" />}
        content={
          editing === null ? (
            <ModalSkeleton />
          ) : (
            <>
              {(modalLoading || submitting) && <ModalSkeleton />}
              <div className={(modalLoading || submitting) ? "pointer-events-none opacity-60" : ""}>
                <ColoniaForm
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
            onCancel={() => {
              if (!submitting) {
                setOpen(false);
                setEditing(null);
              }
            }}
            disabled={submitting}
            entityLabel="Colonia"
            mode={editing ? "update" : "create"}
          />
        }
      />

      <ConfirmDialog />
    </div>
  );
}
