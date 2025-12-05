"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ListChecks, Search, Pencil } from "lucide-react";
import {
  Alert,
  Button,
  ConfirmDialog,
  Modal,
  ModalSkeleton,
  Table,
  Title,
} from "@/components";

import type { Column } from "@/components";
// Si no exportas Column desde "@/components", usa esto en vez del import:
// type Column<T> = {
//   header: string;
//   cell: (row: T) => React.ReactNode;
//   align?: "left" | "center" | "right";
//   className?: string;
// };

import { useUIStore } from "@/store";
import {
  createStatusOrderAction,
  getStatusOrdersAction,
  nextIdStatus,
  StatusOrder,
  updateStatusOrderAction,
} from "../../actions";

import { StatusForm, FooterModal } from "..";

export function PageContent() {
  const [data, setData] = useState<StatusOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<StatusOrder | null>(null);

  // UI store (alerta + confirm)
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const alerta = useUIStore((s) => s.alerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  // Cargar datos iniciales
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const statuses = await getStatusOrdersAction();
        if (mounted) setData(statuses);
      } catch (e) {
        console.error(e);
        if (mounted) {
          setError("No se pudieron cargar los status.");
          mostrarAlerta(
            "Error",
            "No se pudieron cargar los status. Intenta de nuevo.",
            "danger"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [mostrarAlerta]);

  // Skeleton modal
  useEffect(() => {
    if (isModalOpen) {
      setModalLoading(true);
    } else {
      setModalLoading(false);
    }
  }, [isModalOpen]);

  const filteredData = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((s) =>
      [
        s.id_status?.toString() ?? "",
        s.nombre?.toLowerCase() ?? "",
        s.next_status?.toString() ?? "",
        s.next_status_nombre?.toLowerCase() ?? "",
      ].some((v) => v.includes(q))
    );
  }, [data, query]);

  const columns: Column<StatusOrder>[] = [
    {
      header: "ID",
      align: "center",
      className: "w-16 text-center",
      cell: (row) => row.id_status,
    },
    {
      header: "Nombre",
      align: "left",
      className: "min-w-[200px] w-full",
      cell: (row) => (
        <span className="font-medium text-neutral-900">{row.nombre}</span>
      ),
    },
    {
      header: "Siguiente status",
      align: "left",
      className: "min-w-[200px]",
      cell: (row) => (
        <span className="text-sm text-neutral-700">
          {row.next_status_nombre ?? "—"}
        </span>
      ),
    },
    {
      header: "Último",
      align: "center",
      className: "w-24 text-center",
      cell: (row) => (
        <span className="text-xs font-semibold">
          {row.last_status ? "Sí" : "No"}
        </span>
      ),
    },
  ];

  const handleCreate = () => {
    setIsModalOpen(true);
    setModalLoading(true);
    setEditing(null);

    setTimeout(() => {
      const nuevo: StatusOrder = {
        id_status: nextIdStatus(data),
        nombre: "",
        next_status: null,
        last_status: false,
        next_status_nombre: null,
      };
      setEditing(nuevo);
    }, 0);
  };

  const handleEdit = (row: StatusOrder) => {
    setIsModalOpen(true);
    setModalLoading(true);
    setEditing(null);

    setTimeout(() => {
      setEditing({ ...row });
    }, 0);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSave = () => {
    if (!editing) return;

    const exists = data.some((s) => s.id_status === editing.id_status);

    openConfirm({
      titulo: exists ? "Confirmar actualización" : "Confirmar creación",
      mensaje: exists
        ? `¿Deseas actualizar el status "${editing.nombre}"?`
        : `¿Deseas crear el status "${editing.nombre}"?`,
      confirmText: exists ? "Actualizar" : "Crear",
      rejectText: "Cancelar",
      preventClose: false,
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
        await updateStatusOrderAction({
          id_status: editing.id_status,
          nombre: editing.nombre,
          next_status: editing.next_status,
          last_status: editing.last_status,
        });
      } else {
        await createStatusOrderAction({
          nombre: editing.nombre,
          next_status: editing.next_status ?? null,
          last_status: editing.last_status,
        });
      }

      const refreshed = await getStatusOrdersAction();
      setData(refreshed);
      setIsModalOpen(false);
      setEditing(null);

      mostrarAlerta(
        "¡Guardado!",
        exists
          ? "El status se actualizó correctamente."
          : "El status se creó correctamente.",
        "success"
      );
    } catch (e) {
      console.error("Error al guardar status:", e);
      setError("No se pudo guardar el status. Intenta de nuevo.");
      mostrarAlerta(
        "Error",
        "No se pudo guardar el status. Intenta de nuevo.",
        "danger"
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header */}
      <Alert />
      {error && <Alert />}

      <Title
        showBackButton
        backHref="/mantenimiento"
        title="Flujos"
        subtitle="Define los status del pedido."
        icon={<ListChecks className="h-5 w-5" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-4 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            placeholder="Buscar status..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        <Button
          icon={<ListChecks className="w-4 h-4" />}
          variant="warning"
          onClick={handleCreate}
          disabled={submitting}
        >
          Nuevo status
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-600">Cargando status...</p>
      ) : (
        <div className={submitting ? "pointer-events-none opacity-60" : ""}>
          <Table
            data={filteredData}
            columns={columns}
            getRowId={(row) => row.id_status}
            actions={(row) => (
              <Button
                icon={<Pencil className="w-4 h-4" />}
                iconOnly
                variant="white"
                aria-label="Editar"
                onClick={() => handleEdit(row)}
                disabled={submitting}
              />
            )}
            actionsHeader="Acciones"
            ariaLabel="Tabla de status"
          />
        </div>
      )}

      {/* Modal de crear / editar */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editing ? "Editar status" : "Nuevo status"}
        icon={<ListChecks className="w-5 h-5" />}
        content={
          editing === null ? (
            <ModalSkeleton />
          ) : (
            <>
              {(modalLoading || submitting) && <ModalSkeleton />}
              <div
                className={
                  modalLoading || submitting
                    ? "pointer-events-none opacity-60"
                    : ""
                }
              >
                <StatusForm
                  value={editing}
                  onChange={setEditing}
                  onSubmit={handleSave}
                  formId="status-form"
                  onReady={() => setModalLoading(false)}
                  disabled={submitting}
                  allStatuses={data} // 👈 aquí le pasas todos los status
                />
              </div>
            </>
          )
        }
        footer={
          <FooterModal
            disabled={submitting}
            formId="status-form"
            onCancel={handleCloseModal}
          />
        }
      />

      {/* Dialog global de confirmación */}
      <ConfirmDialog />
    </div>
  );
}
