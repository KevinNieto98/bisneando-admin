"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  ClipboardCheck,
  CheckCircle,
  Clock,
  XCircle,
  XOctagon,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { Alert, Title, ConfirmDialog } from "@/components";
import { useUIStore } from "@/store";

import {
  getOrderByIdAction,
  updateOrderStatusByIdAction,
  advanceOrderToNextStatusAction,
} from "../../../actions";

/* =====================
   Tipos auxiliares
   ===================== */

type OrderStatus = "en_progreso" | "pagada" | "rechazada";

// Derivamos el tipo exacto de la server action
type FullOrderByIdResult = NonNullable<
  Awaited<ReturnType<typeof getOrderByIdAction>>
>;

// Mínimo necesario para el select de status
type StatusOrder = {
  id_status: number;
  nombre: string | null;
};

/* =====================
   Helpers generales
   ===================== */

const currency = (n: number) =>
  new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
  }).format(n);

const maskCard = (last4?: string) =>
  last4 ? `•••• •••• •••• ${last4}` : "Tarjeta";

function mapDbStatusToUiStatus(id_status: number | null): OrderStatus {
  if (id_status === 6) return "rechazada";
  if (id_status === 3 || id_status === 4 || id_status === 5) return "pagada";
  return "en_progreso";
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-HN");
}

/* =====================
   GET de status por REST (para usar en cliente)
   ===================== */

async function getStatusOrdersAction(): Promise<StatusOrder[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !apiKey) {
    console.error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return [];
  }

  const url = `${base}/rest/v1/tbl_status_orders?select=*&order=id_status.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(
      "Error al obtener status orders:",
      res.status,
      await res.text()
    );
    return [];
  }

  const data = (await res.json()) as StatusOrder[];
  return data;
}

/* =====================
   Skeleton de la página
   ===================== */

function OrderPageSkeleton() {
  return (
    <div className="flex justify-center items-start mb-32 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col w-full max-w-[1100px] animate-pulse">
        {/* Título */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-40 bg-gray-200 rounded-xl" />
        </div>

        {/* Card actualizar */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="h-6 w-64 bg-gray-200 rounded mb-4" />
          <div className="h-10 w-full bg-gray-200 rounded-xl mb-4" />
          <div className="h-20 w-full bg-gray-200 rounded-xl mb-4" />
          <div className="h-11 w-full bg-gray-200 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-2">
          {/* Resumen */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
              <div className="h-24 w-full bg-gray-200 rounded-xl mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
              </div>
              <div className="h-11 w-full bg-gray-200 rounded-xl mt-6" />
            </div>
          </aside>

          {/* Productos + pago + activity */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
              <div className="space-y-4">
                <div className="h-16 w-full bg-gray-200 rounded-xl" />
                <div className="h-16 w-full bg-gray-200 rounded-xl" />
                <div className="h-16 w-full bg-gray-200 rounded-xl" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
              <div className="h-14 w-full bg-gray-200 rounded-xl" />
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
              <div className="h-24 w-full bg-gray-200 rounded-xl" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* =====================
   PageContent (cliente)
   ===================== */

interface PageContentProps {
  id: string;
}

export function PageContent({ id }: PageContentProps) {
  const router = useRouter();

  // UI store (alerta + confirm)
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  const [order, setOrder] = useState<FullOrderByIdResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // status para el select cuando la orden está en 7
  const [statusOptions, setStatusOptions] = useState<StatusOrder[]>([]);
  const [statusSelectError, setStatusSelectError] = useState<string | null>(
    null
  );
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await getOrderByIdAction(Number(id));
        console.log(data);

        if (!active) return;

        if (!data) {
          throw new Error("No se encontró la orden.");
        }

        setOrder(data);
      } catch (e: any) {
        console.error(e);
        if (active) setLoadError(e?.message ?? "Error al cargar la orden.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  // Cargar catálogo de status para el select (una vez)
  useEffect(() => {
    let active = true;

    const loadStatuses = async () => {
      try {
        const all = await getStatusOrdersAction();
        if (!active) return;

        // Excluimos 5 (finalizada), 6 (rechazada), 7 (problemas)
        const filtered = all.filter(
          (s) => ![5, 6, 7].includes(Number(s.id_status))
        );
        setStatusOptions(filtered);
      } catch (e) {
        console.error("Error al cargar status orders para el select:", e);
      }
    };

    loadStatuses();
    return () => {
      active = false;
    };
  }, []);

  // 🔹 Lógica de actualización (trabajo real)
  const handleStatusAction = async (
    mode: "finish" | "problem" | "reject" | "next",
    observacion: string
  ) => {
    if (!order) {
      throw new Error("No hay orden cargada.");
    }

    if (mode === "next") {
      // Caso especial: si está en 7, usamos el valor del select como destino
      if (order.head.id_status === 7) {
        if (!selectedStatusId) {
          throw new Error("No se seleccionó el estado destino.");
        }

        await updateOrderStatusByIdAction({
          id_order: Number(id),
          id_status_destino: selectedStatusId,
          observacion,
          usuario_actualiza: order.head.usuario_actualiza ?? "admin",
        });
      } else {
        // Flujo normal: avanzar al siguiente status definido en tbl_status_orders
        await advanceOrderToNextStatusAction({
          id_order: Number(id),
          observacion,
          usuario_actualiza: order.head.usuario_actualiza ?? "admin",
        });
      }
    } else {
      // 5 = Finalizar, 7 = Problemas, 6 = Rechazar
      const id_status_destino =
        mode === "finish" ? 5 : mode === "problem" ? 7 : 6;

      await updateOrderStatusByIdAction({
        id_order: Number(id),
        id_status_destino,
        observacion,
        usuario_actualiza: order.head.usuario_actualiza ?? "admin",
      });
    }

    // Recargar orden (por consistencia, aunque luego redirigimos)
    const updated = await getOrderByIdAction(Number(id));
    if (!updated) {
      throw new Error("No se encontró la orden después de actualizar.");
    }

    setOrder(updated);

    // Alert de éxito
    mostrarAlerta(
      "¡Orden actualizada!",
      "La orden se actualizó correctamente.",
      "success"
    );

    // Redirigir al listado (ajusta si quieres otra ruta)
    router.push("/ordenes/en-proceso");
  };

  // 🔹 Handler que valida comentario + (para modo "next" cuando está en 7) el select, luego abre ConfirmDialog
  const triggerStatusUpdate = (mode: "finish" | "problem" | "reject" | "next") => {
    if (!order) return;

    const trimmed = comment.trim();
    if (!trimmed) {
      setCommentError("El comentario es obligatorio para actualizar la orden.");
      return;
    }
    setCommentError(null);

    // Si la orden está en 7 y es el botón "Actualizar orden" (next), el select es obligatorio
    if (mode === "next" && order.head.id_status === 7) {
      if (!selectedStatusId) {
        setStatusSelectError(
          "Debes seleccionar un estado destino para actualizar la orden."
        );
        return;
      }
      setStatusSelectError(null);
    }

    let titulo = "";
    let mensaje = "";
    let confirmText = "";

    switch (mode) {
      case "reject":
        titulo = "Rechazar orden";
        mensaje = `¿Deseas rechazar la orden #${order.head.id_order}?`;
        confirmText = "Rechazar";
        break;
      case "finish":
        titulo = "Finalizar orden";
        mensaje = `¿Deseas finalizar la orden #${order.head.id_order}?`;
        confirmText = "Finalizar";
        break;
      case "problem":
        titulo = "Marcar orden con problemas";
        mensaje = `¿Deseas marcar la orden #${order.head.id_order} como 'Orden con problemas'?`;
        confirmText = "Marcar";
        break;
      case "next":
        if (order.head.id_status === 7 && selectedStatusId) {
          const destino = statusOptions.find(
            (s) => s.id_status === selectedStatusId
          );
          const destinoLabel = destino
            ? `${destino.nombre ?? ""} (#${destino.id_status})`
            : `#${selectedStatusId}`;
          titulo = "Actualizar orden";
          mensaje = `¿Deseas mover la orden #${order.head.id_order} al estado ${destinoLabel}?`;
          confirmText = "Actualizar";
        } else {
          titulo = "Avanzar al siguiente paso";
          mensaje = `¿Deseas avanzar la orden #${order.head.id_order} al siguiente estado del flujo?`;
          confirmText = "Actualizar";
        }
        break;
    }

    openConfirm({
      titulo,
      mensaje,
      confirmText,
      rejectText: "Cancelar",
      preventClose: false,
      onConfirm: async () => {
        try {
          setSaving(true);
          await handleStatusAction(mode, trimmed);
        } catch (e) {
          console.error(e);
          mostrarAlerta(
            "Error",
            "No se pudo actualizar la orden. Intenta de nuevo.",
            "danger"
          );
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const summary = useMemo(() => {
    if (!order) {
      return { itemsCount: 0, subtotal: 0, taxes: 0, total: 0 };
    }
    const itemsCount = order.det.reduce((acc, it) => acc + Number(it.qty), 0);
    const subtotal = Number(order.head.sub_total ?? 0);
    const taxes = Number(order.head.isv ?? 0);
    const total = Number(order.head.total ?? subtotal + taxes);
    return { itemsCount, subtotal, taxes, total };
  }, [order]);

  if (loading) return <OrderPageSkeleton />;

  if (loadError) {
    return (
      <div className="flex justify-center items-center min-h-[300px] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-6 text-center">
          <p className="text-lg font-semibold mb-2">No se pudo cargar la orden</p>
          <p className="text-sm text-gray-600 mb-4">{loadError}</p>
          <Link
            href="/ordenes"
            className="inline-flex items-center rounded-xl px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Regresar
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-[300px] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-6 text-center">
          <p className="text-lg font-semibold mb-2">Orden no encontrada</p>
          <p className="text-sm text-gray-600 mb-4">
            No se encontró información para la orden #{id}.
          </p>
          <Link
            href="/ordenes"
            className="inline-flex items-center rounded-xl px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Regresar
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = order.head.id_status === 5 || order.head.id_status === 6;
  const uiStatus = mapDbStatusToUiStatus(order.head.id_status);
  const isProblemStatus = order.head.id_status === 7;

  const statusBg =
    uiStatus === "pagada"
      ? "bg-emerald-600"
      : uiStatus === "en_progreso"
        ? "bg-amber-600"
        : "bg-rose-600";

  const payment =
    order.head.id_metodo === 1
      ? { method: "efectivo" as const }
      : { method: "tarjeta" as const, last4: "0000" };

  const lastActivity = order.activity[0];
  const rejectionReason =
    uiStatus === "rechazada"
      ? lastActivity?.observacion ?? order.head.observacion ?? "No especificado."
      : undefined;

  const lat = order.head.latitud ? Number(order.head.latitud) : null;
  const lng = order.head.longitud ? Number(order.head.longitud) : null;
  const hasCoords =
    lat !== null && !Number.isNaN(lat) && lng !== null && !Number.isNaN(lng);

  const isDelivered = order.head.id_status === 5;
  const isRejected = order.head.id_status === 6;

  return (
    <div className="flex justify-center items-start mb-32 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col w-full max-w-[1100px]">
        {/* Alert global */}
        <Alert />

        {/* 🔹 Título */}
        <div className="flex items-center justify-between mb-6">
          <Title
            icon={<ClipboardCheck className="w-5 h-5" />}
            title={`Orden #${order.head.id_order}`}
            subtitle="Detalle de orden"
            showBackButton
          />
        </div>

        {/* 🔹 Apartado: actualizar / resumen de estado de la orden */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">
            {isClosed ? "Estado de la orden" : "Actualizar estado de la orden"}
          </h2>

          {/* Estado actual */}
          <p className="text-sm text-gray-700 mb-3">
            <span className="font-medium">Estado actual:</span>{" "}
            <span className="font-semibold">
              {order.head.status ?? `#${order.head.id_status}`}
            </span>
          </p>

          {isClosed ? (
            // 🔹 BANNER PARA ORDENES CERRADAS (5 o 6)
            <div
              className={`flex flex-col md:flex-row items-center gap-4 rounded-2xl px-4 py-6 md:py-8 min-h-[140px] ${isDelivered
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
            >
              <div className="flex items-center justify-center flex-shrink-0">
                <div
                  className={`rounded-full p-3 md:p-4 ${isDelivered ? "bg-emerald-100" : "bg-rose-100"
                    }`}
                >
                  {isDelivered ? (
                    <CheckCircle className="w-7 h-7" />
                  ) : (
                    <XCircle className="w-7 h-7" />
                  )}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-1">
                <p className="text-base md:text-lg font-semibold">
                  {isDelivered
                    ? "Orden finalizada / entregada"
                    : "Orden rechazada"}
                </p>
                <p className="text-sm leading-snug">
                  {isDelivered
                    ? "Esta orden se encuentra finalizada. No es posible realizar más cambios sobre su flujo."
                    : "Esta orden fue rechazada. No es posible realizar más cambios sobre su flujo."}
                </p>

                {isRejected && rejectionReason && (
                  <div className="mt-3 rounded-xl bg-white/60 border border-rose-200 px-3 py-2 text-xs text-rose-800 text-left">
                    <p className="font-semibold mb-1">Motivo del rechazo</p>
                    <p className="whitespace-pre-wrap break-words">
                      {rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Si está en Orden con Problemas (id_status = 7), mostrar select de destino */}
              {isProblemStatus && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mover a estado
                  </label>
                  <select
                    value={selectedStatusId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedStatusId(v ? Number(v) : null);
                      if (statusSelectError) setStatusSelectError(null);
                    }}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-sm shadow-sm bg-white outline-none transition-all ${statusSelectError
                        ? "border-rose-500 ring-1 ring-rose-400 focus:border-rose-500 focus:ring-rose-400"
                        : "border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10"
                      }`}
                  >
                    <option value="">Selecciona un estado destino...</option>
                    {statusOptions.map((s) => (
                      <option key={s.id_status} value={s.id_status}>
                        #{s.id_status} - {s.nombre ?? "(sin nombre)"}
                      </option>
                    ))}
                  </select>
                  {statusSelectError && (
                    <p className="mt-1 text-xs text-rose-600">
                      {statusSelectError}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Este selector solo se usa cuando la orden está en
                    &quot;Orden con problemas&quot; (status 7). El botón
                    &quot;Actualizar orden&quot; llevará la orden al estado
                    elegido aquí.
                  </p>
                </div>
              )}

              {/* Comentario obligatorio */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentario
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (commentError) setCommentError(null);
                  }}
                  rows={3}
                  placeholder="Describe el motivo de la actualización..."
                  className={`w-full rounded-2xl border px-3 py-2.5 text-sm shadow-sm outline-none transition-all bg-white ${commentError
                      ? "border-rose-500 ring-1 ring-rose-400 focus:border-rose-500 focus:ring-rose-400"
                      : "border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10"
                    }`}
                  aria-invalid={!!commentError}
                  aria-describedby={commentError ? "comment-error" : undefined}
                />
                {commentError && (
                  <p id="comment-error" className="mt-1 text-xs text-rose-600">
                    {commentError}
                  </p>
                )}
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                {/* Rechazar Orden (6) */}
                <button
                  type="button"
                  onClick={() => triggerStatusUpdate("reject")}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white ${saving
                      ? "bg-rose-300 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-700"
                    }`}
                >
                  <XOctagon className="w-4 h-4" />
                  <span>Rechazar orden</span>
                </button>

                {/* Finalizar Orden (5) */}
                <button
                  type="button"
                  onClick={() => triggerStatusUpdate("finish")}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white ${saving
                      ? "bg-emerald-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Finalizar orden</span>
                </button>

                {/* Orden con Problemas (7) - SOLO si aún no está en 7 */}
                {!isProblemStatus && (
                  <button
                    type="button"
                    onClick={() => triggerStatusUpdate("problem")}
                    disabled={saving}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white ${saving
                        ? "bg-amber-300 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-600"
                      }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Orden con problemas</span>
                  </button>
                )}

                {/* Avanzar al siguiente paso del flujo / usar select si está en 7 */}
                <button
                  type="button"
                  onClick={() => triggerStatusUpdate("next")}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white ${saving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-black hover:bg-gray-800"
                    }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Actualizar orden</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* 🔹 Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-2">
          {/* Columna izquierda: Resumen */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-semibold mb-4">Resumen de orden</h3>

              {/* Datos cliente */}
              <div className="rounded-2xl border border-gray-200 p-4 mb-5 text-sm">
                <p className="font-medium mb-1">Cliente / UID</p>

                <p className="text-gray-700 break-all text-xs">
                  {order.head.uid}
                </p>

                {order.head.usuario && (
                  <Link
                    href={`/usuarios/${order.head.uid}`}
                    className="mt-1 inline-flex text-sm text-blue-600 hover:underline"
                  >
                    {order.head.usuario}
                  </Link>
                )}

                <p className="mt-2 text-gray-600">
                  Colonia{" "}
                  <span className="font-medium">
                    {order.head.nombre_colonia ?? "-"}
                  </span>
                </p>
                <p className="text-gray-600">
                  RTN:{" "}
                  <span className="font-medium">
                    {order.head.rtn ?? "-"}
                  </span>
                </p>
                <p className="text-gray-600">
                  Lat/Lng:{" "}
                  <span className="font-medium">
                    {order.head.latitud ?? "-"} / {order.head.longitud ?? "-"}
                  </span>
                </p>

                {hasCoords && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">
                      Ubicación en mapa
                    </p>
                    <div className="w-full h-52 rounded-xl overflow-hidden border border-gray-200">
                      <iframe
                        title="Mapa de ubicación de la orden"
                        src={`https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                        className="w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span>No. Productos</span>
                <span className="text-right">
                  {summary.itemsCount} artículos
                </span>
                <span>Subtotal</span>
                <span className="text-right">
                  {currency(summary.subtotal)}
                </span>
                <span>Impuestos</span>
                <span className="text-right">
                  {currency(summary.taxes)}
                </span>
                <span className="mt-3 text-lg font-semibold">Total:</span>
                <span className="mt-3 text-lg font-semibold text-right">
                  {currency(summary.total)}
                </span>
              </div>

              {/* Método de pago dentro del resumen */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Método de pago</h4>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4">
                  {payment.method === "tarjeta" ? (
                    <CreditCard className="w-5 h-5" />
                  ) : (
                    <Wallet className="w-5 h-5" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {payment.method === "tarjeta"
                        ? maskCard(payment.last4)
                        : "Efectivo / Pago contra entrega"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {payment.method === "tarjeta"
                        ? "Solo se muestran los últimos 4 dígitos."
                        : "Pago contra entrega."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Badge de estado */}
              <div
                className={`mt-6 w-full flex justify-center items-center gap-2 rounded-xl py-3 text-center text-white font-medium ${statusBg}`}
              >
                {uiStatus === "pagada" ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Orden Pagada</span>
                  </>
                ) : uiStatus === "en_progreso" ? (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Orden en Progreso</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    <span>Orden Rechazada</span>
                  </>
                )}
              </div>

              {uiStatus === "rechazada" && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                  <p className="text-sm font-medium">Motivo del rechazo</p>
                  <p className="text-sm">{rejectionReason}</p>
                </div>
              )}
            </div>
          </aside>

          {/* Columna derecha: Detalle + Activity */}
          <section className="lg:col-span-2 space-y-6">
            {/* Detalle productos */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Detalle de productos
              </h2>
              {order.det.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Esta orden no tiene detalle asociado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-gray-600">
                          Producto
                        </th>
                        <th className="py-2 text-right font-medium text-gray-600">
                          Cantidad
                        </th>
                        <th className="py-2 text-right font-medium text-gray-600">
                          Precio
                        </th>
                        <th className="py-2 text-right font-medium text-gray-600">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.det.map((row) => (
                        <tr
                          key={row.id_det}
                          className="border-b last:border-b-0"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {row.url_imagen && (
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                  <Image
                                    src={row.url_imagen}
                                    alt={
                                      (row as any).nombre_producto ??
                                      `Producto #${row.id_producto}`
                                    }
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}

                              <div className="flex flex-col">
                                <Link
                                  href={`/productos/${row.id_producto}`}
                                  className="text-sm font-semibold text-blue-600 hover:underline"
                                >
                                  {(row as any).nombre_producto ??
                                    `Producto #${row.id_producto}`}
                                </Link>
                                <span className="text-xs text-gray-500">
                                  ID: {row.id_producto}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 text-right">{row.qty}</td>
                          <td className="py-3 text-right">
                            {currency(Number(row.precio))}
                          </td>
                          <td className="py-3 text-right">
                            {currency(
                              Number(
                                (row as any).sub_total ??
                                row.qty * row.precio
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Historial de actividad */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Historial de actividad
              </h2>
              {order.activity.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Aún no hay actividades registradas.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-gray-600">
                          Fecha
                        </th>
                        <th className="py-2 text-left font-medium text-gray-600">
                          Status
                        </th>
                        <th className="py-2 text-left font-medium text-gray-600">
                          Usuario
                        </th>
                        <th className="py-2 text-left font-medium text-gray-600">
                          Observación
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.activity.map((act) => (
                        <tr
                          key={act.id_act}
                          className="border-b last:border-b-0"
                        >
                          <td className="py-2 align-top whitespace-nowrap">
                            {formatDateTime(
                              (act as any).fecha_actualizacion ??
                              (act as any).created_at ??
                              (act as any).fecha ??
                              (act as any).fechaCreacion ??
                              null
                            )}
                          </td>
                          <td className="py-2 align-top">
                            {act.status ??
                              (act.id_status != null
                                ? `#${act.id_status}`
                                : "-")}
                          </td>
                          <td className="py-2 align-top">
                            {act.usuario_actualiza ??
                              order.head.usuario_actualiza ??
                              "-"}
                          </td>
                          <td className="py-2 align-top max-w-xs">
                            <p className="text-gray-800 break-words">
                              {act.observacion ?? "-"}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Dialog global de confirmación */}
        <ConfirmDialog />
      </div>
    </div>
  );
}
