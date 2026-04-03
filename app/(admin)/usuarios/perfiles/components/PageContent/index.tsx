"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, UserCog, Info } from "lucide-react";
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
import { PerfilForm } from "../PerfilForm";
import { FooterModal } from "../FooterModal";
import {
  getPerfilesAction,
  postPerfilAction,
  putPerfilAction,
  deletePerfilAction,
  type Perfil,
} from "../../actions";

const PAGE_SIZE = 10;

let _nextTempId = -1;
function tempId() { return _nextTempId--; }

export function PageContent() {
  const [data, setData] = useState<Perfil[]>([]);
  const [query, setQuery] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Perfil | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formId = "perfil-form";

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const perfiles = await getPerfilesAction();
        setData(perfiles);
      } catch {
        mostrarAlerta("Error", "No se pudieron cargar los perfiles.", "danger");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [mostrarAlerta]);

  useEffect(() => { setModalLoading(open); }, [open]);

  // Filtrado y paginación
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((p) => p.nombre_perfil.toLowerCase().includes(q));
  }, [data, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedData = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  // Handlers modal
  const handleCreate = () => {
    setOpen(true);
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({ id_perfil: tempId(), nombre_perfil: "", activo: true });
    }, 0);
  };

  const handleEdit = (p: Perfil) => {
    setOpen(true);
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => { setEditing({ ...p }); }, 0);
  };

  const closeModal = () => {
    if (submitting) return;
    setOpen(false);
    setEditing(null);
  };

  // Guardar (crear o editar)
  const handleSave = () => {
    if (!editing) return;
    const isNew = editing.id_perfil < 0;

    openConfirm({
      titulo: isNew ? "Confirmar creación" : "Confirmar actualización",
      mensaje: isNew
        ? `¿Deseas crear el perfil "${editing.nombre_perfil}"?`
        : `¿Deseas actualizar el perfil "${editing.nombre_perfil}"?`,
      confirmText: isNew ? "Crear" : "Actualizar",
      rejectText: "Cancelar",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          if (isNew) {
            const created = await postPerfilAction(editing.nombre_perfil, editing.activo);
            setData((prev) => [
              ...prev,
              { id_perfil: created.id_perfil, nombre_perfil: created.nombre_perfil, activo: created.is_active },
            ]);
            mostrarAlerta("¡Creado!", "El perfil se creó correctamente.", "success");
          } else {
            const updated = await putPerfilAction(editing.id_perfil, editing.nombre_perfil, editing.activo);
            setData((prev) =>
              prev.map((p) =>
                p.id_perfil === updated.id_perfil
                  ? { id_perfil: updated.id_perfil, nombre_perfil: updated.nombre_perfil, activo: updated.is_active }
                  : p
              )
            );
            mostrarAlerta("¡Actualizado!", "El perfil se actualizó correctamente.", "success");
          }
          setOpen(false);
          setEditing(null);
          setCurrentPage(1);
        } catch {
          mostrarAlerta("Error", "No se pudo guardar el perfil. Intenta de nuevo.", "danger");
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // Toggle activo (optimista)
  const handleToggle = async (id: number, next: boolean) => {
    setData((prev) =>
      prev.map((p) => (p.id_perfil === id ? { ...p, activo: next } : p))
    );
    try {
      const perfil = data.find((p) => p.id_perfil === id);
      if (!perfil) return;
      const updated = await putPerfilAction(id, perfil.nombre_perfil, next);
      setData((prev) =>
        prev.map((p) =>
          p.id_perfil === updated.id_perfil
            ? { id_perfil: updated.id_perfil, nombre_perfil: updated.nombre_perfil, activo: updated.is_active }
            : p
        )
      );
    } catch {
      mostrarAlerta("Error", "No se pudo actualizar el estado.", "danger");
      setData((prev) =>
        prev.map((p) => (p.id_perfil === id ? { ...p, activo: !next } : p))
      );
    }
  };

  // Eliminar
  const handleDelete = (p: Perfil) => {
    openConfirm({
      titulo: "Eliminar perfil",
      mensaje: `¿Estás seguro de que deseas eliminar el perfil "${p.nombre_perfil}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      rejectText: "Cancelar",
      onConfirm: async () => {
        try {
          await deletePerfilAction(p.id_perfil);
          setData((prev) => prev.filter((x) => x.id_perfil !== p.id_perfil));
          mostrarAlerta("Eliminado", "El perfil fue eliminado correctamente.", "success");
        } catch {
          mostrarAlerta("Error", "No se pudo eliminar el perfil.", "danger");
        }
      },
    });
  };

  const hasNoResults = !initialLoading && filtered.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Alert />

      <Title
        title="Perfiles"
        subtitle="Gestiona los perfiles de acceso de la plataforma"
        showBackButton
        backHref="/"
        icon={<UserCog className="h-6 w-6 text-neutral-700" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar perfil..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
            Total: <strong className="text-neutral-900">{data.length}</strong>
          </span>
          {query && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
              Coincidencias: <strong className="text-neutral-900">{filtered.length}</strong>
            </span>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          Nuevo perfil
        </button>
      </div>

      {/* Contenido */}
      {initialLoading ? (
        <TableSkeleton rows={8} showActions />
      ) : hasNoResults ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <Info className="h-6 w-6 text-neutral-500" />
          <p className="text-sm text-neutral-600">
            {query
              ? <>No hay resultados para <span className="font-semibold">"{query}"</span>.</>
              : "No hay perfiles registrados aún."}
          </p>
        </div>
      ) : (
        <div className={submitting ? "pointer-events-none opacity-60" : ""}>
          <Table
            data={paginatedData}
            columns={[
              {
                header: "ID",
                className: "w-16 text-center",
                align: "center",
                cell: (row) => <span className="font-mono text-sm">{row.id_perfil}</span>,
              },
              {
                header: "Nombre del perfil",
                className: "min-w-[200px] w-full text-left",
                align: "left",
                cell: (row) => (
                  <span className="font-medium text-neutral-900">{row.nombre_perfil}</span>
                ),
              },
              {
                header: "Estado",
                className: "w-44 text-center",
                align: "center",
                cell: (row) => (
                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      checked={row.activo}
                      onChange={(next) => handleToggle(row.id_perfil, next)}
                      ariaLabel={`Cambiar estado de ${row.nombre_perfil}`}
                    />
                    <span className={`text-xs font-medium ${row.activo ? "text-emerald-700" : "text-neutral-500"}`}>
                      {row.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                ),
              },
            ]}
            getRowId={(row) => row.id_perfil}
            actions={(row) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(row)}
                  className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-60"
                  aria-label="Editar perfil"
                  title="Editar"
                  disabled={submitting}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(row)}
                  className="inline-flex items-center rounded-lg p-2 hover:bg-red-50 text-red-500 disabled:opacity-60"
                  aria-label="Eliminar perfil"
                  title="Eliminar"
                  disabled={submitting}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            actionsHeader="Acciones"
            ariaLabel="Tabla de perfiles"
          />
        </div>
      )}

      {/* Paginación */}
      {!hasNoResults && totalPages > 1 && (
        <div className="mt-2 flex justify-center">
          <Pagination
            totalPages={totalPages}
            currentPage={safePage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal
        open={open}
        size="md"
        onClose={closeModal}
        title={editing && editing.id_perfil >= 0 ? "Editar perfil" : "Nuevo perfil"}
        icon={<UserCog className="w-5 h-5" />}
        content={
          editing === null ? (
            <ModalSkeleton />
          ) : (
            <>
              {(modalLoading || submitting) && <ModalSkeleton />}
              <div className={(modalLoading || submitting) ? "pointer-events-none opacity-60" : ""}>
                <PerfilForm
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
            onCancel={closeModal}
            disabled={submitting}
          />
        }
      />

      <ConfirmDialog />
    </div>
  );
}
