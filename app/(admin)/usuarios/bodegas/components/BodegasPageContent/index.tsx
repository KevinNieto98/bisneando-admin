"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye, Plus, Search, Warehouse, Info,
  Phone, MapPin, User, ScrollText, Database,
} from "lucide-react";
import {
  Alert, Modal, Table, Title, Switch,
  ModalSkeleton, TableSkeleton, Pagination,
} from "@/components";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUIStore } from "@/store";
import { BodegaForm } from "../BodegaForm";
import {
  getBodegasAction,
  getEncargadosBodegaAction,
  getUsuariosActivosBodegaAction,
  getLogsByBodegaIdAction,
  postBodegaAction,
  putBodegaAction,
  asignarEncargadoAction,
  desactivarEncargadoAction,
  registrarLogBodegaAction,
  type BodegaFormValue,
  type Bodega,
  type LogBodega,
  type UsuarioBodegaOpcion,
} from "../../actions";
import clsx from "clsx";

const PAGE_SIZE = 10;
let _tmp = -1;
const tempId = () => _tmp--;

const EMPTY_FORM: BodegaFormValue = {
  nombre_bodega: "",
  is_active: true,
  direccion: null,
  telefono: null,
  latitud: null,
  longitud: null,
  encargado_id: null,
};

type ModalTab = "datos" | "logs";

const ACCION_BADGE: Record<string, string> = {
  CREAR:                "bg-emerald-100 text-emerald-700",
  EDITAR:               "bg-blue-100 text-blue-700",
  ELIMINAR:             "bg-red-100 text-red-700",
  ACTIVAR:              "bg-emerald-100 text-emerald-700",
  DESACTIVAR:           "bg-amber-100 text-amber-700",
  ASIGNAR_ENCARGADO:    "bg-slate-100 text-slate-700",
  DESACTIVAR_ENCARGADO: "bg-orange-100 text-orange-700",
};

export function BodegasPageContent() {
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm   = useUIStore((s) => s.openConfirm);

  const [data, setData]                       = useState<Bodega[]>([]);
  const [usuariosOpciones, setUsuariosOpciones] = useState<UsuarioBodegaOpcion[]>([]);
  const [query, setQuery]                     = useState("");
  const [loading, setLoading]                 = useState(true);
  const [currentPage, setCurrentPage]         = useState(1);

  // Modal
  const [open, setOpen]               = useState(false);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [formValue, setFormValue]     = useState<BodegaFormValue>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [activeTab, setActiveTab]     = useState<ModalTab>("datos");

  // Logs dentro del modal
  const [logs, setLogs]               = useState<LogBodega[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const formId  = "bodega-form";
  const isNew   = editingId !== null && editingId < 0;

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [bodegas, encargados, usuarios] = await Promise.all([
          getBodegasAction(),
          getEncargadosBodegaAction(),
          getUsuariosActivosBodegaAction(),
        ]);

        const encMap = new Map<number, { nombre: string; id: string }>();
        encargados.forEach((e) => {
          if (e.id_bodega != null)
            encMap.set(e.id_bodega, { nombre: `${e.nombre} ${e.apellido}`.trim(), id: e.id });
        });

        setData(
          bodegas.map((b) => ({
            ...b,
            encargado:    encMap.get(b.id_bodega)?.nombre ?? null,
            encargado_id: encMap.get(b.id_bodega)?.id     ?? null,
          }))
        );
        setUsuariosOpciones(usuarios);
      } catch {
        mostrarAlerta("Error", "No se pudieron cargar los datos.", "danger");
      } finally {
        setLoading(false);
      }
    })();
  }, [mostrarAlerta]);

  // Cargar logs al cambiar de tab o al abrir modal en edición
  useEffect(() => {
    if (!open || isNew || editingId === null || editingId < 0) return;
    if (activeTab !== "logs") return;

    setLogsLoading(true);
    getLogsByBodegaIdAction(editingId)
      .then(setLogs)
      .finally(() => setLogsLoading(false));
  }, [open, activeTab, editingId, isNew]);

  // Resetear tab al abrir modal
  useEffect(() => {
    if (open) setActiveTab("datos");
  }, [open]);

  useEffect(() => { setModalLoading(open); }, [open]);

  // ── Filtrado / paginación ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((b) =>
      [b.nombre_bodega, b.direccion ?? "", b.telefono ?? "", b.encargado ?? ""]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [data, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(Math.max(1, currentPage), totalPages);
  const paginated  = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  const updateLocal = (updated: Bodega) =>
    setData((prev) => prev.map((b) => (b.id_bodega === updated.id_bodega ? updated : b)));

  // ── Modal ──────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    setEditingId(tempId());
    setFormValue(EMPTY_FORM);
    setLogs([]);
    setOpen(true);
    setModalLoading(true);
  };

  const handleEdit = (b: Bodega) => {
    setEditingId(b.id_bodega);
    setFormValue({
      nombre_bodega: b.nombre_bodega,
      is_active:     b.is_active,
      direccion:     b.direccion,
      telefono:      b.telefono,
      latitud:       b.latitud,
      longitud:      b.longitud,
      encargado_id:  b.encargado_id,
    });
    setLogs([]);
    setOpen(true);
    setModalLoading(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setOpen(false);
    setEditingId(null);
  };

  // ── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (editingId === null) return;
    const bodegaActual = isNew ? null : data.find((b) => b.id_bodega === editingId) ?? null;

    openConfirm({
      titulo:      isNew ? "Confirmar creación" : "Confirmar actualización",
      mensaje:     isNew
        ? `¿Deseas crear la bodega "${formValue.nombre_bodega}"?`
        : `¿Deseas guardar los cambios de "${formValue.nombre_bodega}"?`,
      confirmText: isNew ? "Crear" : "Actualizar",
      rejectText:  "Cancelar",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const { encargado_id: nuevoEncargadoId, ...bodegaPayload } = formValue;
          const anteriorEncargadoId = bodegaActual?.encargado_id ?? null;

          // 1) Guardar bodega
          const savedBodega = isNew
            ? await postBodegaAction(bodegaPayload)
            : await putBodegaAction(editingId, bodegaPayload);

          // 2) Cambio de encargado
          const encargadoCambio = nuevoEncargadoId !== anteriorEncargadoId;
          if (encargadoCambio) {
            if (anteriorEncargadoId) await asignarEncargadoAction(anteriorEncargadoId, null);
            if (nuevoEncargadoId)    await asignarEncargadoAction(nuevoEncargadoId, savedBodega.id_bodega);
          }

          const encargadoObj   = usuariosOpciones.find((u) => u.id === nuevoEncargadoId);
          const encargadoNombre = encargadoObj
            ? `${encargadoObj.nombre} ${encargadoObj.apellido}`.trim()
            : null;

          // 3) Estado local
          const bodegaFull: Bodega = { ...savedBodega, encargado: encargadoNombre, encargado_id: nuevoEncargadoId };
          if (isNew) setData((prev) => [...prev, bodegaFull]);
          else       updateLocal(bodegaFull);

          // 4) Logs
          await registrarLogBodegaAction({
            id_bodega:     savedBodega.id_bodega,
            nombre_bodega: savedBodega.nombre_bodega,
            accion:        isNew ? "CREAR" : "EDITAR",
            descripcion:   isNew
              ? `Bodega "${savedBodega.nombre_bodega}" creada`
              : `Bodega "${savedBodega.nombre_bodega}" actualizada`,
            datos_antes:   bodegaActual ?? null,
            datos_despues: { ...savedBodega, encargado: encargadoNombre },
          });

          if (encargadoCambio) {
            await registrarLogBodegaAction({
              id_bodega:     savedBodega.id_bodega,
              nombre_bodega: savedBodega.nombre_bodega,
              accion:        "ASIGNAR_ENCARGADO",
              descripcion:   encargadoNombre
                ? `Encargado asignado: ${encargadoNombre}`
                : "Encargado desasignado",
              datos_antes:   { encargado: bodegaActual?.encargado ?? null },
              datos_despues: { encargado: encargadoNombre },
            });
          }

          mostrarAlerta(
            isNew ? "¡Creada!" : "¡Actualizada!",
            isNew ? "La bodega se creó correctamente." : "La bodega se actualizó correctamente.",
            "success"
          );

          setOpen(false);
          setEditingId(null);
          setCurrentPage(1);
        } catch (e: any) {
          mostrarAlerta("Error", e?.message ?? "No se pudo guardar.", "danger");
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // ── Toggle activa ──────────────────────────────────────────────────────────
  const handleToggle = async (bodega: Bodega, next: boolean) => {
    setData((prev) =>
      prev.map((b) => (b.id_bodega === bodega.id_bodega ? { ...b, is_active: next } : b))
    );
    try {
      const { encargado: _, encargado_id: __, ...rest } = bodega;
      const updated = await putBodegaAction(bodega.id_bodega, { ...rest, is_active: next });

      if (!next && bodega.encargado_id) {
        await desactivarEncargadoAction(bodega.encargado_id);
        await registrarLogBodegaAction({
          id_bodega:     bodega.id_bodega,
          nombre_bodega: bodega.nombre_bodega,
          accion:        "DESACTIVAR_ENCARGADO",
          descripcion:   `Usuario "${bodega.encargado}" desactivado al inactivar la bodega`,
          datos_antes:   { encargado_activo: true },
          datos_despues: { encargado_activo: false },
        });
      }

      updateLocal({ ...updated, encargado: bodega.encargado, encargado_id: bodega.encargado_id });

      await registrarLogBodegaAction({
        id_bodega:     bodega.id_bodega,
        nombre_bodega: bodega.nombre_bodega,
        accion:        next ? "ACTIVAR" : "DESACTIVAR",
        descripcion:   `Bodega "${bodega.nombre_bodega}" ${next ? "activada" : "desactivada"}`,
        datos_antes:   { is_active: !next },
        datos_despues: { is_active: next },
      });
    } catch {
      mostrarAlerta("Error", "No se pudo actualizar el estado.", "danger");
      setData((prev) =>
        prev.map((b) => (b.id_bodega === bodega.id_bodega ? { ...b, is_active: !next } : b))
      );
    }
  };


  const hasNoResults = !loading && filtered.length === 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-4 space-y-6">
      <Alert />

      <Title
        title="Bodegas"
        subtitle="Gestión de bodegas y encargados"
        showBackButton
        backHref="/"
        icon={<Warehouse className="h-6 w-6 text-neutral-700" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar bodega o encargado…"
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
            Total: <strong className="text-neutral-900">{data.length}</strong>
          </span>
          {query && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
              Resultados: <strong className="text-neutral-900">{filtered.length}</strong>
            </span>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          Nueva bodega
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <TableSkeleton rows={8} showActions />
      ) : hasNoResults ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <Info className="h-6 w-6 text-neutral-500" />
          <p className="text-sm text-neutral-600">
            {query
              ? <>No hay resultados para <span className="font-semibold">"{query}"</span>.</>
              : "No hay bodegas registradas aún."}
          </p>
        </div>
      ) : (
        <div className={submitting ? "pointer-events-none opacity-60" : ""}>
          <Table
            data={paginated}
            columns={[
              {
                header: "ID",
                align: "center",
                className: "w-14",
                cell: (row) => (
                  <span className="font-mono text-sm font-semibold text-neutral-700">#{row.id_bodega}</span>
                ),
              },
              {
                header: "Nombre",
                align: "left",
                cell: (row) => (
                  <span className="font-semibold text-neutral-900">{row.nombre_bodega}</span>
                ),
              },
              {
                header: "Dirección / Teléfono",
                align: "left",
                cell: (row) => (
                  <div className="flex flex-col gap-0.5 text-xs text-neutral-600">
                    {row.direccion && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />{row.direccion}
                      </span>
                    )}
                    {row.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" />{row.telefono}
                      </span>
                    )}
                    {!row.direccion && !row.telefono && <span className="text-neutral-400">—</span>}
                  </div>
                ),
              },
              {
                header: "Encargado",
                align: "left",
                className: "w-48",
                cell: (row) =>
                  row.encargado && row.encargado_id ? (
                    <Link
                      href={`/usuarios/${row.encargado_id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <User className="h-3.5 w-3.5" />{row.encargado}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                      Sin encargado
                    </span>
                  ),
              },
              {
                header: "Estado",
                align: "center",
                className: "w-36",
                cell: (row) => (
                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      checked={row.is_active}
                      onChange={(next) => handleToggle(row, next)}
                      ariaLabel={`Estado de ${row.nombre_bodega}`}
                    />
                    <span className={`text-xs font-medium ${row.is_active ? "text-emerald-700" : "text-neutral-500"}`}>
                      {row.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                ),
              },
            ]}
            getRowId={(row) => row.id_bodega}
            actions={(row) => (
              <button
                onClick={() => handleEdit(row)}
                className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-60"
                title="Ver detalle"
                disabled={submitting}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            actionsHeader="Acciones"
            ariaLabel="Tabla de bodegas"
          />
        </div>
      )}

      {!hasNoResults && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination totalPages={totalPages} currentPage={safePage} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* ── Modal ── */}
      <Modal
        open={open}
        size="xl"
        onClose={closeModal}
        title={isNew ? "Nueva bodega" : "Editar bodega"}
        icon={<Warehouse className="w-5 h-5" />}
        content={
          editingId === null ? (
            <ModalSkeleton />
          ) : (
            <div className="flex flex-col gap-0">
              {/* Tabs — solo visibles en edición */}
              {!isNew && (
                <div className="flex border-b border-neutral-200 mb-5 -mx-1">
                  <button
                    onClick={() => setActiveTab("datos")}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                      activeTab === "datos"
                        ? "border-neutral-900 text-neutral-900"
                        : "border-transparent text-neutral-500 hover:text-neutral-700"
                    )}
                  >
                    <Database className="h-4 w-4" />
                    Datos
                  </button>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                      activeTab === "logs"
                        ? "border-neutral-900 text-neutral-900"
                        : "border-transparent text-neutral-500 hover:text-neutral-700"
                    )}
                  >
                    <ScrollText className="h-4 w-4" />
                    Logs
                    {logs.length > 0 && (
                      <span className="inline-flex items-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-medium text-neutral-600">
                        {logs.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Tab: Datos */}
              {(isNew || activeTab === "datos") && (
                <>
                  {(modalLoading || submitting) && <ModalSkeleton />}
                  <div className={(modalLoading || submitting) ? "pointer-events-none opacity-60" : ""}>
                    <BodegaForm
                      value={formValue}
                      onChange={setFormValue}
                      onSubmit={handleSave}
                      usuarios={usuariosOpciones}
                      formId={formId}
                      onReady={() => setModalLoading(false)}
                      disabled={submitting}
                    />
                  </div>
                </>
              )}

              {/* Tab: Logs */}
              {!isNew && activeTab === "logs" && (
                <div className="min-h-[200px]">
                  {logsLoading ? (
                    <TableSkeleton rows={4} showActions={false} />
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-neutral-400">
                      <ScrollText className="h-8 w-8" />
                      <p className="text-sm">No hay logs para esta bodega.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-neutral-200">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                          <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Fecha</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Acción</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Descripción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {logs.map((log) => (
                            <tr key={log.id_log} className="hover:bg-neutral-50">
                              <td className="px-3 py-2.5 whitespace-nowrap text-xs text-neutral-500 font-mono">
                                {new Date(log.created_at).toLocaleString("es-HN", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={clsx(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  ACCION_BADGE[log.accion] ?? "bg-neutral-100 text-neutral-600"
                                )}>
                                  {log.accion}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-neutral-600">{log.descripcion ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        }
        footer={
          // En tab de logs no se muestra el botón Guardar
          activeTab === "logs" ? (
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form={formId}
                disabled={submitting}
                className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {submitting ? "Guardando…" : "Guardar"}
              </button>
            </div>
          )
        }
      />

      <ConfirmDialog />
    </div>
  );
}
