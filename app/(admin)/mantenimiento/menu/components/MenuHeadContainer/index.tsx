// =====================================
// /app/menus/MenuHeadContainer.tsx
// =====================================
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PanelsTopLeft, Pencil, Plus, Search } from "lucide-react";
import {
  Alert,
  Button,
  Modal,
  Switch,
  Table,
  TableSkeleton,
  Title,
  Pagination,
  ModalSkeleton,
} from "@/components";
import { useUIStore } from "@/store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useMenusHeadData } from "../../hooks/useMenusHeadData";
import { MenuHeadForm } from "./MenuHeadForm";


// ====== Tipos auxiliares ======
export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

export type MenuHead = {
  id_menu_head: number;
  nombre: string;     // SIEMPRE MAYÚSCULAS (UI + servidor)
  is_active: boolean;
};

// ====== Utils locales ======
const nextId = (rows: { id_menu_head: number }[]) =>
  rows.length ? Math.max(...rows.map((r) => r.id_menu_head)) + 1 : 1;

function useClientPagination<T>(items: T[], pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, items.length) / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  useEffect(() => {
    // Si cambia la fuente, aseguramos página válida
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [items.length, totalPages, currentPage]);
  return { currentPage: safePage, setCurrentPage, totalPages, pageItems };
}

// Footer de modal reutilizable con formId
const FooterModalHead = ({ disabled = false, formId = "menu-head-form" }: { disabled?: boolean; formId?: string }) => {
  const closeModal = useUIStore((s) => s.closeModal);
  const setEditing = useUIStore((s) => s.setEditing) as (v: MenuHead | null) => void;

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => {
          if (disabled) return;
          closeModal();
          setEditing(null);
        }}
        className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
        disabled={disabled}
      >
        Cancelar
      </button>
      <button
        type="submit"
        form={formId}
        className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        disabled={disabled}
        aria-busy={disabled}
      >
        Guardar
      </button>
    </div>
  );
};

// =====================================
// Contenedor principal
// =====================================
export function MenuHeadContainer() {
  // UI store
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  const isModalOpen = useUIStore((s) => s.isModalOpen);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const editing = useUIStore((s) => s.editing) as MenuHead | null;
  const setEditing = useUIStore((s) => s.setEditing) as (v: MenuHead | null) => void;

  // Estados UI
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Datos
  const { data, loading, error, createItem, updateItem, toggleActive } = useMenusHeadData();

  // Búsqueda
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return data;
    return data.filter((r) => (r.nombre ?? "").toUpperCase().includes(q));
  }, [data, query]);

  // Paginación
  const PAGE_SIZE = 10;
  const { currentPage, setCurrentPage, totalPages, pageItems: paginatedData } =
    useClientPagination(filtered, PAGE_SIZE);

  // Control de skeleton de modal
  useEffect(() => {
    setModalLoading(isModalOpen);
  }, [isModalOpen]);

  // Handlers
  const handleCreate = () => {
    openModal();
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({ id_menu_head: nextId(data), nombre: "", is_active: true });
      // onReady del form apaga modalLoading
    }, 0);
  };

  const handleEdit = (row: MenuHead) => {
    openModal();
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({ ...row });
    }, 0);
  };

  const handleToggleActive = async (id: number, next?: boolean) => {
    try {
      await toggleActive(id, next);
    } catch (e) {
      console.error("Error al actualizar estado:", e);
      mostrarAlerta("Error", "No se pudo actualizar el estado.", "danger");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    const exists = data.some((m) => m.id_menu_head === editing.id_menu_head);

    openConfirm({
      titulo: exists ? "Confirmar actualización" : "Confirmar creación",
      mensaje: exists
        ? `¿Deseas actualizar el Menú Head "${editing.nombre}"?`
        : `¿Deseas crear el Menú Head "${editing.nombre}"?`,
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
      if (!editing) return;

      if (exists) {
        await updateItem(editing);
      } else {
        await createItem({ nombre: editing.nombre, is_active: editing.is_active });
      }

      closeModal();
      setEditing(null);

      mostrarAlerta(
        "¡Guardado!",
        exists ? "El Menú Head se actualizó correctamente." : "El Menú Head se creó correctamente.",
        "success"
      );

      setCurrentPage(1);
    } catch (e) {
      console.error("Error al guardar Menú Head:", e);
      mostrarAlerta("Error", "No se pudo guardar. Intenta de nuevo.", "danger");
    }
  };

  // Columnas
  const columns: Column<MenuHead>[] = useMemo(
    () => [
      {
        header: "ID",
        className: "w-16 text-center",
        align: "center",
        cell: (row) => row.id_menu_head,
      },
      {
        header: "Nombre",
        className: "min-w-[220px] w-full text-left",
        align: "left",
        cell: (row) => <span className="font-medium text-neutral-900">{row.nombre}</span>,
      },
      {
        header: "Estado",
        className: "w-40 text-center",
        align: "center",
        cell: (row) => (
          <div className="flex items-center justify-center gap-2">
            <Switch
              checked={row.is_active}
              onChange={(next) => handleToggleActive(row.id_menu_head, next)}
              ariaLabel={`Cambiar estado de ${row.nombre}`}
            />
            <span className="text-xs font-medium text-neutral-700">
              {row.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
        ),
      },
    ],
    [handleToggleActive]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header */}
      <Alert />
      {error && <Alert />}


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
            placeholder="Buscar menú head..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCreate}
            icon={<Plus className="w-4 h-4" />}
            variant="warning"
            disabled={submitting}
          >
            Nuevo  Head
          </Button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <TableSkeleton rows={10} showActions />
      ) : (
        <div className={submitting ? "pointer-events-none opacity-60" : ""}>
          <Table
            data={paginatedData}
            columns={columns}
            getRowId={(row) => row.id_menu_head}
            actions={(row: MenuHead) => (
              <Button
                onClick={() => handleEdit(row)}
                icon={<Pencil className="w-4 h-4" />}
                iconOnly
                variant="white"
                aria-label="Editar"
                disabled={submitting}
              />
            )}
            actionsHeader="Acciones"
            ariaLabel="Tabla de Menú Head"
          />
        </div>
      )}

      {/* Paginación */}
      <div className="mt-2 flex justify-center">
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          if (submitting) return;
          closeModal();
          setEditing(null);
        }}
        title={editing ? "Editar Menú Head" : "Nuevo Menú Head"}
        icon={<PanelsTopLeft className="w-5 h-5" />}
        content={
          editing === null ? (
            <ModalSkeleton />
          ) : (
            <>
              {(modalLoading || submitting) && <ModalSkeleton />}
              <div className={(modalLoading || submitting) ? "pointer-events-none opacity-60" : ""}>
                <MenuHeadForm
                  value={editing}
                  onChange={setEditing}
                  onSubmit={handleSave}
                  formId="menu-head-form"
                  onReady={() => setModalLoading(false)}
                  disabled={submitting}
                />
              </div>
            </>
          )
        }
        footer={<FooterModalHead disabled={submitting} formId="menu-head-form" />}
      />

      <ConfirmDialog />
    </div>
  );
}
