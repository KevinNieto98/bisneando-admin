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
  getFulfillmentByOrderIdAndStatusAction,
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

type FulfillmentRow = {
  id_bodega: number | null;
  is_used: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-40 bg-gray-200 rounded-xl" />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="h-6 w-64 bg-gray-200 rounded mb-4" />
          <div className="h-10 w-full bg-gray-200 rounded-xl mb-4" />
          <div className="h-20 w-full bg-gray-200 rounded-xl mb-4" />
          <div className="h-11 w-full bg-gray-200 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-2">
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

  // ✅ Fulfillment state (filtrado por el status actual de la orden)
  const [fulfillmentRows, setFulfillmentRows] = useState<FulfillmentRow[]>([]);
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false);
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null);

  // helper: cargar fulfillment según status actual
  const loadFulfillment = async (orderId: number, status: number | null) => {
    try {
      setFulfillmentLoading(true);
      setFulfillmentError(null);
      const full = await getFulfillmentByOrderIdAndStatusAction(orderId, status);
      setFulfillmentRows(Array.isArray(full) ? full : []);
    } catch (e: any) {
      console.error(e);
      setFulfillmentError(e?.message ?? "No se pudo cargar el fulfillment.");
      setFulfillmentRows([]);
    } finally {
      setFulfillmentLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await getOrderByIdAction(Number(id));
        if (!active) return;

        if (!data) throw new Error("No se encontró la orden.");

        setOrder(data);

        // ✅ Cargar fulfillment SOLO del status actual de la orden
        const currentStatus = Number(data.head.id_status ?? 0) || null;
        await loadFulfillment(Number(id), currentStatus);
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
    if (!order) throw new Error("No hay orden cargada.");

    if (mode === "next") {
      if (order.head.id_status === 7) {
        if (!selectedStatusId) throw new Error("No se seleccionó el estado destino.");

        await updateOrderStatusByIdAction({
          id_order: Number(id),
          id_status_destino: selectedStatusId,
          observacion,
          usuario_actualiza: order.head.usuario_actualiza ?? "admin",
        });
      } else {
        await advanceOrderToNextStatusAction({
          id_order: Number(id),
          observacion,
          usuario_actualiza: order.head.usuario_actualiza ?? "admin",
        });
      }
    } else {
      const id_status_destino =
        mode === "finish" ? 5 : mode === "problem" ? 7 : 6;

      await updateOrderStatusByIdAction({
        id_order: Number(id),
        id_status_destino,
        observacion,
        usuario_actualiza: order.head.usuario_actualiza ?? "admin",
      });
    }

    // Recargar orden
    const updated = await getOrderByIdAction(Number(id));
    if (!updated) throw new Error("No se encontró la orden después de actualizar.");

    setOrder(updated);

    // ✅ Refrescar fulfillment del NUEVO status actual (por si cambió)
    const newStatus = Number(updated.head.id_status ?? 0) || null;
    await loadFulfillment(Number(id), newStatus);

    mostrarAlerta(
      "¡Orden actualizada!",
      "La orden se actualizó correctamente.",
      "success"
    );

    router.push("/ordenes/en-proceso");
  };

  const triggerStatusUpdate = (
    mode: "finish" | "problem" | "reject" | "next"
  ) => {
    if (!order) return;

    const trimmed = comment.trim();
    if (!trimmed) {
      setCommentError("El comentario es obligatorio para actualizar la orden.");
      return;
    }
    setCommentError(null);

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
          const destino = statusOptions.find((s) => s.id_status === selectedStatusId);
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
    if (!order) return { itemsCount: 0, subtotal: 0, taxes: 0, total: 0 };
    const itemsCount = order.det.reduce((acc, it) => acc + Number(it.qty), 0);
    const subtotal = Number((order.head as any).sub_total ?? 0);
    const taxes = Number((order.head as any).isv ?? 0);
    const total = Number((order.head as any).total ?? subtotal + taxes);
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
    (order.head as any).id_metodo === 1
      ? { method: "efectivo" as const }
      : { method: "tarjeta" as const, last4: "0000" };

  const lastActivity = (order as any).activity?.[0];
  const rejectionReason =
    uiStatus === "rechazada"
      ? lastActivity?.observacion ??
        (order.head as any).observacion ??
        "No especificado."
      : undefined;

  const lat = (order.head as any).latitud ? Number((order.head as any).latitud) : null;
  const lng = (order.head as any).longitud ? Number((order.head as any).longitud) : null;
  const hasCoords =
    lat !== null && !Number.isNaN(lat) && lng !== null && !Number.isNaN(lng);

  const isDelivered = order.head.id_status === 5;
  const isRejected = order.head.id_status === 6;

  return (
    <div className="flex justify-center items-start mb-32 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col w-full max-w-[1100px]">
        <Alert />

        <div className="flex items-center justify-between mb-6">
          <Title
            icon={<ClipboardCheck className="w-5 h-5" />}
            title={`Orden #${order.head.id_order}`}
            subtitle="Detalle de orden"
            showBackButton
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">
            {isClosed ? "Estado de la orden" : "Actualizar estado de la orden"}
          </h2>

          <p className="text-sm text-gray-700 mb-3">
            <span className="font-medium">Estado actual:</span>{" "}
            <span className="font-semibold">
              {order.head.status ?? `#${order.head.id_status}`}
            </span>
          </p>

          {isClosed ? (
            <div
              className={`flex flex-col md:flex-row items-center gap-4 rounded-2xl px-4 py-6 md:py-8 min-h-[140px] ${
                isDelivered
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center justify-center flex-shrink-0">
                <div
                  className={`rounded-full p-3 md:p-4 ${
                    isDelivered ? "bg-emerald-100" : "bg-rose-100"
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
                  {isDelivered ? "Orden finalizada / entregada" : "Orden rechazada"}
                </p>
                <p className="text-sm leading-snug">
                  {isDelivered
                    ? "Esta orden se encuentra finalizada. No es posible realizar más cambios sobre su flujo."
                    : "Esta orden fue rechazada. No es posible realizar más cambios sobre su flujo."}
                </p>

                {isRejected && rejectionReason && (
                  <div className="mt-3 rounded-xl bg-white/60 border border-rose-200 px-3 py-2 text-xs text-rose-800 text-left">
                    <p className="font-semibold mb-1">Motivo del rechazo</p>
                    <p className="whitespace-pre-wrap break-words">{rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
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
                    className={`w-full rounded-2xl border px-3 py-2.5 text-sm shadow-sm bg-white outline-none transition-all ${
                      statusSelectError
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
                    <p className="mt-1 text-xs text-rose-600">{statusSelectError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Este selector solo se usa cuando la orden está en &quot;Orden con
                    problemas&quot; (status 7). El botón &quot;Actualizar orden&quot;
                    llevará la orden al estado elegido aquí.
                  </p>
                </div>
              )}

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
                  className={`w-full rounded-2xl border px-3 py-2.5 text-sm shadow-sm outline-none transition-all bg-white ${
                    commentError
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => triggerStatusUpdate("reject")}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white ${
                    saving
                      ? "bg-rose-300 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  <XOctagon className="w-4 h-4" />
                  <span>Rechazar orden</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerStatusUpdate("finish")}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white ${
                    saving
                      ? "bg-emerald-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Finalizar orden</span>
                </button>

                {!isProblemStatus && (
                  <button
                    type="button"
                    onClick={() => triggerStatusUpdate("problem")}
                    disabled={saving}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white ${
                      saving
                        ? "bg-amber-300 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-600"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Orden con problemas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => triggerStatusUpdate("next")}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white ${
                    saving
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-2">
          {/* Columna izquierda: Resumen */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-semibold mb-4">Resumen de orden</h3>

              <div className="rounded-2xl border border-gray-200 p-4 mb-5 text-sm">
                <p className="font-medium mb-1">Cliente / UID</p>

                <p className="text-gray-700 break-all text-xs">{order.head.uid}</p>

                {(order.head as any).usuario && (
                  <Link
                    href={`/usuarios/${order.head.uid}`}
                    className="mt-1 inline-flex text-sm text-blue-600 hover:underline"
                  >
                    {(order.head as any).usuario}
                  </Link>
                )}

                <p className="mt-2 text-gray-600">
                  Colonia{" "}
                  <span className="font-medium">{order.head.nombre_colonia ?? "-"}</span>
                </p>
                <p className="text-gray-600">
                  RTN: <span className="font-medium">{(order.head as any).rtn ?? "-"}</span>
                </p>

                <p className="mt-2 text-gray-600">
                  Instrucciones de entrega:{" "}
                  <span className="font-medium">
                    {(order.head as any).instrucciones_entrega ??
                      (order.head as any).instrucciones ??
                      "-"}
                  </span>
                </p>

                <p className="text-gray-600">
                  Lat/Lng:{" "}
                  <span className="font-medium">
                    {(order.head as any).latitud ?? "-"} / {(order.head as any).longitud ?? "-"}
                  </span>
                </p>

                {hasCoords && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Ubicación en mapa</p>
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

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span>No. Productos</span>
                <span className="text-right">{summary.itemsCount} artículos</span>
                <span>Subtotal</span>
                <span className="text-right">{currency(summary.subtotal)}</span>
                <span>Impuestos</span>
                <span className="text-right">{currency(summary.taxes)}</span>
                <span className="mt-3 text-lg font-semibold">Total:</span>
                <span className="mt-3 text-lg font-semibold text-right">
                  {currency(summary.total)}
                </span>
              </div>

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

          {/* Columna derecha */}
          <section className="lg:col-span-2 space-y-6">
            {/* Detalle productos */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Detalle de productos</h2>

              {order.det.length === 0 ? (
                <p className="text-sm text-gray-600">Esta orden no tiene detalle asociado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-gray-600">Producto</th>
                        <th className="py-2 text-left font-medium text-gray-600">Bodega</th>
                        <th className="py-2 text-right font-medium text-gray-600">Cantidad</th>
                        <th className="py-2 text-right font-medium text-gray-600">Precio</th>
                        <th className="py-2 text-right font-medium text-gray-600">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {order.det.map((row: any) => (
                        <tr key={row.id_det} className="border-b last:border-b-0">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {row.url_imagen && (
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                  <Image
                                    src={row.url_imagen}
                                    alt={row.nombre_producto ?? `Producto #${row.id_producto}`}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                </div>
                              )}

                              <div className="flex flex-col">
                                <Link
                                  href={`/productos/${row.id_producto}`}
                                  className="text-sm font-semibold text-blue-600 hover:underline"
                                >
                                  {row.nombre_producto ?? `Producto #${row.id_producto}`}
                                </Link>
                                <span className="text-xs text-gray-500">ID: {row.id_producto}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3">
                            <span className="text-gray-800">{row.bodega ?? "-"}</span>
                          </td>

                          <td className="py-3 text-right">{row.qty}</td>
                          <td className="py-3 text-right">{currency(Number(row.precio))}</td>
                          <td className="py-3 text-right">
                            {currency(Number(row.sub_total ?? row.qty * row.precio))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ✅ Fulfillment (solo status actual) */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-1">Fulfillment por bodega</h2>
              <p className="text-xs text-gray-500 mb-4">
                Mostrando únicamente registros del status actual{" "}
                <span className="font-semibold">#{order.head.id_status ?? "-"}</span>.
              </p>

              {fulfillmentLoading ? (
                <p className="text-sm text-gray-600">Cargando fulfillment…</p>
              ) : fulfillmentError ? (
                <p className="text-sm text-rose-600">{fulfillmentError}</p>
              ) : fulfillmentRows.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No hay registros de fulfillment para este status.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-gray-600">Bodega</th>
                        <th className="py-2 text-left font-medium text-gray-600">Estado</th>
                        <th className="py-2 text-left font-medium text-gray-600">Fecha Asignación</th>
                        <th className="py-2 text-left font-medium text-gray-600">Fecha Actualización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fulfillmentRows.map((r, idx) => (
                        <tr key={`${r.id_bodega ?? "null"}_${idx}`} className="border-b last:border-b-0">
                          <td className="py-2">
                            {r.id_bodega != null ? `Bodega ${r.id_bodega}` : "-"}
                          </td>
                          <td className="py-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                r.is_used
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {r.is_used ? "Listo" : "Pendiente"}
                            </span>
                          </td>
                          <td className="py-2 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                          <td className="py-2 whitespace-nowrap">{formatDateTime(r.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                Esta tabla audita qué bodegas ya marcaron el paso (is_used=true) y cuándo fue la última actualización.
              </p>
            </div>

            {/* Historial de actividad */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Historial de actividad</h2>

              {(order as any).activity?.length === 0 ? (
                <p className="text-sm text-gray-600">Aún no hay actividades registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-gray-600">Fecha</th>
                        <th className="py-2 text-left font-medium text-gray-600">Status</th>
                        <th className="py-2 text-left font-medium text-gray-600">Usuario</th>
                        <th className="py-2 text-left font-medium text-gray-600">Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order as any).activity.map((act: any) => (
                        <tr key={act.id_act} className="border-b last:border-b-0">
                          <td className="py-2 align-top whitespace-nowrap">
                            {formatDateTime(
                              act.fecha_actualizacion ??
                                act.created_at ??
                                act.fecha ??
                                act.fechaCreacion ??
                                null
                            )}
                          </td>
                          <td className="py-2 align-top">
                            {act.status ?? (act.id_status != null ? `#${act.id_status}` : "-")}
                          </td>
                          <td className="py-2 align-top">
                            {act.usuario_actualiza ?? (order.head as any).usuario_actualiza ?? "-"}
                          </td>
                          <td className="py-2 align-top max-w-xs">
                            <p className="text-gray-800 break-words">{act.observacion ?? "-"}</p>
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

        <ConfirmDialog />
      </div>
    </div>
  );
}
