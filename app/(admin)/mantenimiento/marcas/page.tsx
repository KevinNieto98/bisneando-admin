'use client';

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tag, Search } from 'lucide-react';
import { Alert, Button, Modal, Switch, Table, TableSkeleton, Title, Pagination } from "@/components";
import { getMarcasAction, postTMarcasAction, putMarca } from "./actions";
import { FooterModal, MarcaForm } from "./components";
import { useUIStore } from "@/store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Tipado de columnas si tu Table no exporta el tipo:
type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

// Tipos
interface Marca {
  id_marca: number;
  nombre_marca: string;
  is_active: boolean;
}

// Type guard
function isMarca(v: unknown): v is Marca {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id_marca === 'number' &&
    typeof o.nombre_marca === 'string' &&
    typeof o.is_active === 'boolean'
  );
}

// Helper para crear IDs locales
function nextId(arr: Marca[]) {
  return (arr.reduce((max, m) => (m.id_marca > max ? m.id_marca : max), 0) || 0) + 1;
}

export default function MarcasPage() {
  // Store UI
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const alerta = useUIStore((s) => s.alerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  const isModalOpen = useUIStore((s) => s.isModalOpen);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const editing = useUIStore((s) => s.editing) as Marca | null;
  const setEditing = useUIStore((s) => s.setEditing) as (v: Marca | null) => void;

  // Estado de datos
  const [data, setData] = useState<Marca[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔢 Paginación (cliente)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Carga inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const marcas = await getMarcasAction();
        if (mounted) setData(marcas);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Error desconocido');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formId = "marca-form";

  // Filtro por búsqueda
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((m) =>
      [m.id_marca.toString(), m.nombre_marca.toLowerCase()].some((s) => s.includes(q))
    );
  }, [data, query]);

  // Total de páginas y datos paginados
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  // Si cambia el total de páginas (por filtro o recarga), ajusta currentPage si quedó fuera de rango
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Handlers CRUD
  const handleCreate = () => {
    setEditing({ id_marca: nextId(data), nombre_marca: "", is_active: true });
    openModal();
  };

  const handleEdit = (m: Marca) => {
    setEditing({ ...m });
    openModal();
  };

  const handleToggleDisponible = async (id: number, next?: boolean) => {
    const current = data.find((m) => m.id_marca === id);
    if (!current) return;

    const newActive = typeof next === "boolean" ? next : !current.is_active;

    // Optimistic UI
    setData((prev) =>
      prev.map((m) =>
        m.id_marca === id ? { ...m, is_active: newActive } : m
      )
    );

    try {
      await putMarca(id, current.nombre_marca, newActive);
    } catch (error) {
      console.error("Error al actualizar disponibilidad:", error);
      // Rollback
      setData((prev) =>
        prev.map((m) =>
          m.id_marca === id ? { ...m, is_active: current.is_active } : m
        )
      );
    }
  };

  const handleSave = async () => {
    if (!editing || !isMarca(editing)) return;

    const exists = data.some((m) => m.id_marca === editing.id_marca);

    openConfirm({
      titulo: exists ? 'Confirmar actualización' : 'Confirmar creación',
      mensaje: exists
        ? `¿Deseas actualizar la marca "${editing.nombre_marca}"?`
        : `¿Deseas crear la marca "${editing.nombre_marca}"?`,
      confirmText: exists ? 'Actualizar' : 'Crear',
      rejectText: 'Cancelar',
      onConfirm: async () => {
        await doSave({ exists });
      },
    });
  };

  // Lógica de guardado (create/update)
  const doSave = async ({ exists }: { exists: boolean }) => {
    setLoading(true);
    try {
      if (exists) {
        await putMarca(editing!.id_marca, editing!.nombre_marca, editing!.is_active);
      } else {
        await postTMarcasAction(editing!.nombre_marca, editing!.is_active);
      }

      const marcas = await getMarcasAction();
      setData(marcas);

      closeModal();
      setEditing(null);

      mostrarAlerta(
        '¡Guardado!',
        exists ? 'La marca se actualizó correctamente.' : 'La marca se creó correctamente.',
        'success'
      );

      // Tras guardar, volver a la primera página para ver el cambio si hace falta
      setCurrentPage(1);
    } catch (error) {
      console.error('Error al guardar marca:', error);
      mostrarAlerta('Error', 'No se pudo guardar la marca. Intenta de nuevo.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Columnas (con Switch en 'Disponible')
  const columns: Column<Marca>[] = [
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
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header */}
      <Alert title={alerta.titulo} msg={alerta.mensaje} type={alerta.tipo} />
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
              setCurrentPage(1); // reset al buscar
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
          key={`pag-${totalPages}-${currentPage}`} // fuerza sync si cambia currentPage externamente
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal de creación/edición */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          closeModal();
          setEditing(null);
        }}
        title={editing ? "Editar marca" : "Nueva marca"}
        icon={<Tag className="w-5 h-5" />}
        content={
          editing && (
            <MarcaForm
              value={editing}
              onChange={setEditing}
              onSubmit={handleSave}
              formId={formId}
            />
          )
        }
        footer={<FooterModal />}
      />

      <ConfirmDialog />
    </div>
  );
}
