"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, CreditCard, Search } from 'lucide-react';
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
} from '@/components';

import { useUIStore } from '@/store';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import {
  Column,
  Metodo,
  isMetodo,
  nextId,
  useFilteredData,
  useClientPagination,
  useMetodosData,
} from '../../utils';
import { MetodoForm } from '../MetodosForm';
import { FooterModal } from '../FooterModal';

export  function PageContent() {
  // UI store
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  const isModalOpen = useUIStore((s) => s.isModalOpen);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const editing = useUIStore((s) => s.editing) as Metodo | null;
  const setEditing = useUIStore((s) => s.setEditing) as (v: Metodo | null) => void;

  // Estado para mostrar skeleton mientras se prepara el form
  const [modalLoading, setModalLoading] = useState(false);
  // Estado para bloquear el formulario y acciones mientras se envía
  const [submitting, setSubmitting] = useState(false);

  // Data
  const { data, loading, error, toggleDisponible, createMetodo, updateMetodo } =
    useMetodosData();

  // Búsqueda
  const [query, setQuery] = useState('');
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
      setEditing({
        id_metodo: nextId(data),
        nombre_metodo: '',
        is_active: true,
      });
      // el onReady del form apagará modalLoading
    }, 0);
  };

  const handleEdit = (m: Metodo) => {
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
      console.error('Error al actualizar disponibilidad:', e);
      mostrarAlerta('Error', 'No se pudo actualizar la disponibilidad.', 'danger');
    }
  };

  const handleSave = async () => {
    if (!editing || !isMetodo(editing)) return;

    const exists = data.some((m) => m.id_metodo === editing.id_metodo);

    openConfirm({
      titulo: exists ? 'Confirmar actualización' : 'Confirmar creación',
      mensaje: exists
        ? `¿Deseas actualizar el método \"${editing.nombre_metodo}\"?`
        : `¿Deseas crear el método \"${editing.nombre_metodo}\"?`,
      confirmText: exists ? 'Actualizar' : 'Crear',
      rejectText: 'Cancelar',
      onConfirm: async () => {
        // Bloquea la UI durante el guardado
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
        await updateMetodo(editing!);
      } else {
        await createMetodo({
          nombre_metodo: editing!.nombre_metodo,
          is_active: editing!.is_active,
        });
      }

      closeModal();
      setEditing(null);

      mostrarAlerta(
        '¡Guardado!',
        exists
          ? 'El método de pago se actualizó correctamente.'
          : 'El método de pago se creó correctamente.',
        'success'
      );

      setCurrentPage(1);
    } catch (e) {
      console.error('Error al guardar método de pago:', e);
      mostrarAlerta('Error', 'No se pudo guardar el método. Intenta de nuevo.', 'danger');
    }
  };

  // Columnas
  const columns: Column<Metodo>[] = useMemo(
    () => [
      {
        header: 'ID',
        className: 'w-16 text-center',
        align: 'center',
        cell: (row) => row.id_metodo,
      },
      {
        header: 'Método',
        className: 'min-w-[200px] w-full text-left',
        align: 'left',
        cell: (row) => (
          <span className="font-medium text-neutral-900">{row.nombre_metodo}</span>
        ),
      },
      {
        header: 'Disponible',
        className: 'w-40 text-center',
        align: 'center',
        cell: (row) => (
          <div className="flex items-center justify-center gap-2">
            <Switch
              checked={row.is_active}
              onChange={(next) => handleToggleDisponible(row.id_metodo, next)}
              ariaLabel={`Cambiar disponibilidad de ${row.nombre_metodo}`}
            />
            <span className="text-xs font-medium text-neutral-700">
              {row.is_active ? 'Sí' : 'No'}
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
      <Alert />
      {error && <Alert />}

      <Title
        showBackButton
        backHref="/mantenimiento"
        title="Métodos de pago"
        subtitle="Gestiona los medios de cobro disponibles"
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
            placeholder="Buscar método..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />} variant="warning">
            Nuevo método
          </Button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <TableSkeleton rows={10} showActions />
      ) : (
        <div className={submitting ? 'pointer-events-none opacity-60' : ''}>
          <Table
            data={paginatedData}
            columns={columns}
            getRowId={(row) => row.id_metodo}
            actions={(row: Metodo) => (
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
            ariaLabel="Tabla de métodos de pago"
          />
        </div>
      )}

      {/* Paginación */}
      <div className="mt-2 flex justify-center">
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          if (submitting) return;
          closeModal();
          setEditing(null);
        }}
        title={editing ? 'Editar método de pago' : 'Nuevo método de pago'}
        icon={<CreditCard className="w-5 h-5" />}
        content={
          editing === null ? (
            null
          ) : (
            <>
              {(modalLoading || submitting) && <ModalSkeleton />}
              <div className={(modalLoading || submitting) ? 'pointer-events-none opacity-60' : ''}>
                <MetodoForm
                  value={editing}
                  onChange={setEditing}
                  onSubmit={handleSave}
                  formId="metodo-form"
                  onReady={() => setModalLoading(false)}
                  disabled={submitting}
                />
              </div>
            </>
          )
        }
        footer={<FooterModal disabled={submitting} />}
      />

      <ConfirmDialog />
    </div>
  );
}
