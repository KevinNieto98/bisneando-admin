// src/app/(tu-ruta)/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tag, Search } from 'lucide-react';
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
import { FooterModal, MarcaForm } from "./components";
import { useUIStore } from "@/store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  Column,
  Marca,
  isMarca,
  nextId,
  useFilteredData,
  useClientPagination,
  useMarcasData,
} from "./utils";



export default function MarcasPage() {
  // UI store
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const alerta = useUIStore((s) => s.alerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  const isModalOpen = useUIStore((s) => s.isModalOpen);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const editing = useUIStore((s) => s.editing) as Marca | null;
  const setEditing = useUIStore((s) => s.setEditing) as (v: Marca | null) => void;

  // Estado para mostrar skeleton mientras se prepara el form
  const [modalLoading, setModalLoading] = useState(false);

  // Data
  const {
    data,
    loading,
    error,
    toggleDisponible,
    createMarca,
    updateMarca,
  } = useMarcasData();

  // Búsqueda
  const [query, setQuery] = useState("");
  const filtered = useFilteredData(data, query);

  // Paginación
  const PAGE_SIZE = 10;
  const { currentPage, setCurrentPage, totalPages, pageItems: paginatedData } =
    useClientPagination(filtered, PAGE_SIZE);

  // 🔁 Cada vez que se abre el modal, mostramos skeleton de entrada
  useEffect(() => {
    if (isModalOpen) {
      setModalLoading(true);
    } else {
      setModalLoading(false);
    }
  }, [isModalOpen]);

  // Handlers
  const handleCreate = () => {
    // 1) Abrir el modal vacío (editing=null) para que se vea el skeleton YA
    openModal();
    setModalLoading(true);
    setEditing(null);

    // 2) En el siguiente tick, setear el editing real para montar el form
    setTimeout(() => {
      setEditing({ id_marca: nextId(data), nombre_marca: "", is_active: true });
      // el onReady del form apagará modalLoading
    }, 0);
  };

  const handleEdit = (m: Marca) => {
    openModal();
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({ ...m });
      // el onReady del form apagará modalLoading
    }, 0);
  };

  const handleToggleDisponible = async (id: number, next?: boolean) => {
    try {
      await toggleDisponible(id, next);
    } catch (e) {
      console.error("Error al actualizar disponibilidad:", e);
      mostrarAlerta("Error", "No se pudo actualizar la disponibilidad.", "danger");
    }
  };

  const handleSave = async () => {
    if (!editing || !isMarca(editing)) return;

    const exists = data.some((m) => m.id_marca === editing.id_marca);

    openConfirm({
      titulo: exists ? "Confirmar actualización" : "Confirmar creación",
      mensaje: exists
        ? `¿Deseas actualizar la marca "${editing.nombre_marca}"?`
        : `¿Deseas crear la marca "${editing.nombre_marca}"?`,
      confirmText: exists ? "Actualizar" : "Crear",
      rejectText: "Cancelar",
      onConfirm: async () => {
        await doSave({ exists });
      },
    });
  };

  const doSave = async ({ exists }: { exists: boolean }) => {
    try {
      if (exists) {
        await updateMarca(editing!);
      } else {
        await createMarca({ nombre_marca: editing!.nombre_marca, is_active: editing!.is_active });
      }

      closeModal();
      setEditing(null);

      mostrarAlerta(
        "¡Guardado!",
        exists ? "La marca se actualizó correctamente." : "La marca se creó correctamente.",
        "success"
      );

      setCurrentPage(1);
    } catch (e) {
      console.error("Error al guardar marca:", e);
      mostrarAlerta("Error", "No se pudo guardar la marca. Intenta de nuevo.", "danger");
    }
  };

  // Columnas
  const columns: Column<Marca>[] = useMemo(
    () => [
      {
        header: "ID",
        className: "w-16 text-center",
        align: "center",
        cell: (row) => row.id_marca,
      },
      {
        header: "Nombre",
        className: "min-w-[200px] w-full text-left",
        align: "left",
        cell: (row) => (
          <span className="font-medium text-neutral-900">{row.nombre_marca}</span>
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
              onChange={(next) => handleToggleDisponible(row.id_marca, next)}
              ariaLabel={`Cambiar disponibilidad de ${row.nombre_marca}`}
            />
            <span className="text-xs font-medium text-neutral-700">
              {row.is_active ? "Sí" : "No"}
            </span>
          </div>
        ),
      },
    ],
    [handleToggleDisponible]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header */}
      <Alert  />
      {error && <Alert  />}

      <Title
        showBackButton
        backHref="/mantenimiento"
        title="Marcas"
        subtitle="Gestiona las marcas de productos"
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
            placeholder="Buscar marca..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCreate}
            icon={<Plus className="w-4 h-4" />}
            variant="warning"
          >
            Nueva marca
          </Button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <TableSkeleton rows={10} showActions />
      ) : (
        <Table
          data={paginatedData}
          columns={columns}
          getRowId={(row) => row.id_marca}
          actions={(row: Marca) => (
            <Button
              onClick={() => handleEdit(row)}
              icon={<Pencil className="w-4 h-4" />}
              iconOnly
              variant="white"
              aria-label="Editar"
            />
          )}
          actionsHeader="Acciones"
          ariaLabel="Tabla de marcas"
        />
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
          closeModal();
          setEditing(null);
        }}
        title={editing ? "Editar marca" : "Nueva marca"}
        icon={<Tag className="w-5 h-5" />}
        content={
          // 👉 Si editing es null mostramos skeleton (abre instantáneo),
          //    luego montamos el form en el siguiente tick y onReady apaga modalLoading.
          editing === null ? (
            <ModalSkeleton />
          ) : (
            <>
              {modalLoading && <ModalSkeleton />}
              <div className={modalLoading ? "sr-only" : ""}>
                <MarcaForm
                  value={editing}
                  onChange={setEditing}
                  onSubmit={handleSave}
                  formId="marca-form"
                  onReady={() => setModalLoading(false)}
                />
              </div>
            </>
          )
        }
        footer={<FooterModal />}
      />

      <ConfirmDialog />
    </div>
  );
}
