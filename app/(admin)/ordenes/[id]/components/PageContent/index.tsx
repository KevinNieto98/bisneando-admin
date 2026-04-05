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
  Truck,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { Alert, Title, ConfirmDialog } from "@/components";
import { useUIStore } from "@/store";

import {
  getOrderByIdAction,
  updateOrderStatusByIdAction,
  advanceOrderToNextStatusAction,
  getFulfillmentByOrderIdAndStatusAction,
  assignDeliveryAction,
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

type DeliveryUser = {
  id: string;
  nombre: string | null;
  apellido: string | null;
};

async function getDeliveryUsersAction(): Promise<DeliveryUser[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !apiKey) return [];

  const url = `${base}/rest/v1/tbl_usuarios?select=id,nombre,apellido&id_perfil=eq.6&is_active=eq.true&order=nombre.asc`;
  const res = await fetch(url, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

/* =====================
   Skeleton de la página
   ===================== */

function OrderPageSkeleton() {
  return (
    <div className="flex justify-center items-start pb-32 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1400px] animate-pulse">
        <div className="flex items-center justify-between mb-6 pt-1">
          <div className="h-8 w-44 bg-gray-200 rounded-xl" />
          <div className="h-7 w-28 bg-gray-200 rounded-full" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 xl:gap-8">
          <aside className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="h-5 w-52 bg-gray-200 rounded mb-4" />
              <div className="h-20 w-full bg-gray-200 rounded-xl mb-4" />
              <div className="grid grid-cols-4 gap-2">
                <div className="h-10 bg-gray-200 rounded-xl" />
                <div className="h-10 bg-gray-200 rounded-xl" />
                <div className="h-10 bg-gray-200 rounded-xl" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-14 w-full bg-gray-200 rounded-xl" />
                <div className="h-14 w-full bg-gray-200 rounded-xl" />
                <div className="h-14 w-full bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
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

  // Delivery assignment (id_status === 4)
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");
  const [assigningDelivery, setAssigningDelivery] = useState(false);

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

  // Cargar deliveries cuando la orden está en status 4 u 8,
  // o cuando el selector de destino (desde status 7) apunta a 8
  useEffect(() => {
    const s = order?.head.id_status;
    const needsDelivery = s === 4 || s === 8 || selectedStatusId === 8;
    if (!needsDelivery) return;
    getDeliveryUsersAction().then(setDeliveryUsers).catch(() => setDeliveryUsers([]));
  }, [order?.head.id_status, selectedStatusId]);

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
        } catch (e: any) {
          console.error("[triggerStatusUpdate] error:", e);
          mostrarAlerta(
            "Error al actualizar",
            e?.message ?? "No se pudo actualizar la orden. Intenta de nuevo.",
            "danger"
          );
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleAssignDelivery = () => {
    if (!order || !selectedDeliveryId) return;
    const delivery = deliveryUsers.find((u) => u.id === selectedDeliveryId);
    if (!delivery) return;
    const nombreDelivery = `${delivery.nombre ?? ""} ${delivery.apellido ?? ""}`.trim();

    openConfirm({
      titulo: "Asignar delivery",
      mensaje: `¿Deseas asignar a "${nombreDelivery}" como delivery de la orden #${order.head.id_order}? La orden pasará a En Camino.`,
      confirmText: "Asignar",
      rejectText: "Cancelar",
      onConfirm: async () => {
        try {
          setAssigningDelivery(true);
          await assignDeliveryAction({
            id_order: Number(id),
            uid_delivery: selectedDeliveryId,
            nombre_delivery: nombreDelivery,
            usuario_actualiza: order.head.usuario_actualiza ?? "admin",
          });

          const updated = await getOrderByIdAction(Number(id));
          if (updated) {
            setOrder(updated);
            await loadFulfillment(Number(id), 8);
          }

          mostrarAlerta("¡Delivery asignado!", `${nombreDelivery} fue asignado correctamente.`, "success");
        } catch (e: any) {
          mostrarAlerta("Error", e?.message ?? "No se pudo asignar el delivery.", "danger");
        } finally {
          setAssigningDelivery(false);
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
    <div className="flex justify-center items-start pb-32 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1400px]">
        <Alert />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pt-1">
          <Title
            icon={<ClipboardCheck className="w-5 h-5" />}
            title={`Orden #${order.head.id_order}`}
            subtitle="Detalle de orden"
            showBackButton
          />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-sm ${statusBg}`}
          >
            {uiStatus === "pagada" ? (
              <CheckCircle className="w-4 h-4" />
            ) : uiStatus === "en_progreso" ? (
              <Clock className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {order.head.status ?? `#${order.head.id_status}`}
          </span>
        </div>

        {/* Layout principal: sidebar fijo izquierda + contenido derecha */}
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 xl:gap-8 items-start">

          {/* ── SIDEBAR IZQUIERDO (sticky en xl+) ── */}
          <aside className="xl:sticky xl:top-4 space-y-5">

            {/* Tarjeta cliente */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-base">Información del cliente</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${statusBg}`}
                >
                  {uiStatus === "pagada" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : uiStatus === "en_progreso" ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {uiStatus === "pagada"
                    ? "Pagada"
                    : uiStatus === "en_progreso"
                    ? "En Progreso"
                    : "Rechazada"}
                </span>
              </div>
              <div className="px-5 py-4 space-y-2.5 text-sm">
                {(order.head as any).usuario && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-gray-500 shrink-0">Cliente</span>
                    <Link
                      href={`/usuarios/${order.head.uid}`}
                      className="font-semibold text-blue-600 hover:underline text-right"
                    >
                      {(order.head as any).usuario}
                    </Link>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-500 shrink-0">UID</span>
                  <span className="text-gray-700 break-all text-xs text-right font-mono">
                    {order.head.uid}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Colonia</span>
                  <span className="font-medium text-right">{order.head.nombre_colonia ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">RTN</span>
                  <span className="font-medium">{(order.head as any).rtn ?? "-"}</span>
                </div>
                {((order.head as any).instrucciones_entrega ||
                  (order.head as any).instrucciones) && (
                  <div className="pt-1">
                    <p className="text-gray-500 mb-1">Instrucciones de entrega</p>
                    <p className="text-gray-800 text-xs bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      {(order.head as any).instrucciones_entrega ??
                        (order.head as any).instrucciones}
                    </p>
                  </div>
                )}
                {hasCoords && (
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                    <span>Coordenadas</span>
                    <span className="font-mono">
                      {lat?.toFixed(5)}, {lng?.toFixed(5)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mapa (cuando hay coordenadas) */}
            {hasCoords && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-base">Ubicación de entrega</p>
                </div>
                <div className="w-full h-52">
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

            {/* Resumen financiero */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-base">Resumen de orden</h3>
              </div>
              <div className="px-5 py-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Productos</span>
                  <span className="font-medium text-gray-900">{summary.itemsCount} artículos</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{currency(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Impuestos</span>
                  <span>{currency(summary.taxes)}</span>
                </div>
                <div className="flex justify-between pt-3 mt-1 border-t border-gray-100">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-base font-bold text-gray-900">{currency(summary.total)}</span>
                </div>
              </div>

              {/* Método de pago */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  {payment.method === "tarjeta" ? (
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                      <Wallet className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {payment.method === "tarjeta"
                        ? maskCard(payment.last4)
                        : "Efectivo / Contra entrega"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.method === "tarjeta"
                        ? "Últimos 4 dígitos"
                        : "Pago al recibir"}
                    </p>
                  </div>
                </div>
              </div>

              {uiStatus === "rechazada" && rejectionReason && (
                <div className="mx-5 mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                  <p className="text-xs font-semibold mb-1">Motivo del rechazo</p>
                  <p className="text-xs">{rejectionReason}</p>
                </div>
              )}
            </div>
          </aside>

          {/* ── COLUMNA DERECHA: acciones + tablas ── */}
          <div className="space-y-5">

            {/* Actualizar estado */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                {isClosed ? (
                  isDelivered ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )
                ) : (
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                )}
                <h2 className="font-semibold text-gray-900 text-base">
                  {isClosed ? "Estado de la orden" : "Actualizar estado de la orden"}
                </h2>
              </div>

              <div className="px-6 py-5">
                {/* Asignación de motorista */}
                {(order.head.id_status === 4 || order.head.id_status === 8 || selectedStatusId === 8) && (
                  <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Truck className="w-5 h-5 shrink-0" />
                      <p className="font-semibold text-sm">Asignar motorista</p>
                    </div>
                    <p className="text-xs text-amber-700">
                      {order.head.id_status === 8
                        ? "Esta orden ya tiene un motorista asignado. Puedes reasignar a otro motorista si es necesario."
                        : selectedStatusId === 8
                        ? "Seleccionaste \"Con Motorista Asignado\" como destino. Asigna el motorista y luego confirma la actualización."
                        : "Esta orden está lista para ser asignada a un motorista. Al asignar, pasará automáticamente a En Camino."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedDeliveryId}
                        onChange={(e) => setSelectedDeliveryId(e.target.value)}
                        disabled={assigningDelivery}
                        className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30 disabled:opacity-60"
                      >
                        <option value="">— Selecciona un delivery —</option>
                        {deliveryUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {`${u.nombre ?? ""} ${u.apellido ?? ""}`.trim()}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAssignDelivery}
                        disabled={!selectedDeliveryId || assigningDelivery}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Truck className="w-4 h-4" />
                        {assigningDelivery ? "Asignando…" : "Asignar"}
                      </button>
                    </div>
                    {deliveryUsers.length === 0 && (
                      <p className="text-xs text-amber-600">No hay deliveries activos disponibles.</p>
                    )}
                  </div>
                )}

                {isClosed ? (
                  <div
                    className={`flex flex-col sm:flex-row items-center gap-4 rounded-2xl px-5 py-6 ${
                      isDelivered
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border border-rose-200 text-rose-800"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 rounded-full p-3 ${
                        isDelivered ? "bg-emerald-100" : "bg-rose-100"
                      }`}
                    >
                      {isDelivered ? (
                        <CheckCircle className="w-7 h-7" />
                      ) : (
                        <XCircle className="w-7 h-7" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <p className="font-semibold text-base">
                        {isDelivered ? "Orden finalizada / entregada" : "Orden rechazada"}
                      </p>
                      <p className="text-sm leading-snug opacity-80">
                        {isDelivered
                          ? "Esta orden se encuentra finalizada. No es posible realizar más cambios."
                          : "Esta orden fue rechazada. No es posible realizar más cambios."}
                      </p>
                      {isRejected && rejectionReason && (
                        <div className="mt-3 rounded-xl bg-white/60 border border-rose-200 px-3 py-2 text-xs text-left">
                          <p className="font-semibold mb-0.5">Motivo del rechazo</p>
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
                        <p className="mt-1 text-xs text-gray-400">
                          Selector disponible cuando la orden está en &quot;Orden con problemas&quot; (status 7).
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comentario <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => {
                          setComment(e.target.value);
                          if (commentError) setCommentError(null);
                        }}
                        rows={3}
                        placeholder="Describe el motivo de la actualización..."
                        className={`w-full rounded-2xl border px-3 py-2.5 text-sm shadow-sm outline-none transition-all bg-white resize-none ${
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

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => triggerStatusUpdate("reject")}
                        disabled={saving}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors ${
                          saving ? "bg-rose-300 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700"
                        }`}
                      >
                        <XOctagon className="w-4 h-4 shrink-0" />
                        <span>Rechazar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerStatusUpdate("finish")}
                        disabled={saving}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors ${
                          saving ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        <CheckSquare className="w-4 h-4 shrink-0" />
                        <span>Finalizar</span>
                      </button>

                      {!isProblemStatus && (
                        <button
                          type="button"
                          onClick={() => triggerStatusUpdate("problem")}
                          disabled={saving}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors ${
                            saving ? "bg-amber-300 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Problemas</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerStatusUpdate("next")}
                        disabled={saving}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors ${
                          saving ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-700"
                        }`}
                      >
                        <ArrowRight className="w-4 h-4 shrink-0" />
                        <span>Actualizar</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Detalle de productos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-base">Detalle de productos</h2>
              </div>
              <div className="px-6 py-5">
                {order.det.length === 0 ? (
                  <p className="text-sm text-gray-500">Esta orden no tiene detalle asociado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                          <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Bodega</th>
                          <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Cant.</th>
                          <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                          <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.det.map((row: any) => (
                          <tr key={row.id_det} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                {row.url_imagen && (
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                    <Image
                                      src={row.url_imagen}
                                      alt={row.nombre_producto ?? `Producto #${row.id_producto}`}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <Link
                                    href={`/productos/${row.id_producto}`}
                                    className="text-sm font-semibold text-blue-600 hover:underline leading-tight"
                                  >
                                    {row.nombre_producto ?? `Producto #${row.id_producto}`}
                                  </Link>
                                  <span className="text-xs text-gray-400">ID: {row.id_producto}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-gray-700">{row.bodega ?? "-"}</td>
                            <td className="py-3 text-right font-medium">{row.qty}</td>
                            <td className="py-3 text-right text-gray-600">{currency(Number(row.precio))}</td>
                            <td className="py-3 text-right font-semibold">{currency(Number(row.sub_total ?? row.qty * row.precio))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Fulfillment + Historial en grid 2 cols en lg+ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Fulfillment */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 text-base">Fulfillment por bodega</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Status actual:{" "}
                    <span className="font-semibold text-gray-600">#{order.head.id_status ?? "-"}</span>
                  </p>
                </div>
                <div className="px-5 py-4">
                  {fulfillmentLoading ? (
                    <p className="text-sm text-gray-500">Cargando…</p>
                  ) : fulfillmentError ? (
                    <p className="text-sm text-rose-600">{fulfillmentError}</p>
                  ) : fulfillmentRows.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin registros para este status.</p>
                  ) : (
                    <div className="space-y-2">
                      {fulfillmentRows.map((r, idx) => (
                        <div
                          key={`${r.id_bodega ?? "null"}_${idx}`}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {r.id_bodega != null ? `Bodega ${r.id_bodega}` : "-"}
                            </p>
                            <p className="text-xs text-gray-400">{formatDateTime(r.updated_at)}</p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              r.is_used
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {r.is_used ? "Listo" : "Pendiente"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-gray-400">
                    Audita qué bodegas marcaron is_used=true.
                  </p>
                </div>
              </div>

              {/* Historial de actividad */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 text-base">Historial de actividad</h2>
                </div>
                <div className="px-5 py-4">
                  {(order as any).activity?.length === 0 ? (
                    <p className="text-sm text-gray-500">Aún no hay actividades registradas.</p>
                  ) : (
                    <div className="space-y-3">
                      {(order as any).activity.map((act: any, idx: number) => (
                        <div key={act.id_act ?? idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            {idx < (order as any).activity.length - 1 && (
                              <div className="w-px flex-1 bg-gray-200 mt-1" />
                            )}
                          </div>
                          <div className="pb-3 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                {act.status ?? (act.id_status != null ? `#${act.id_status}` : "-")}
                              </span>
                              <span className="text-xs text-gray-400">
                                {act.usuario_actualiza ??
                                  (order.head as any).usuario_actualiza ??
                                  "-"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">
                              {formatDateTime(
                                act.fecha_actualizacion ??
                                  act.created_at ??
                                  act.fecha ??
                                  act.fechaCreacion ??
                                  null
                              )}
                            </p>
                            {act.observacion && (
                              <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100 break-words">
                                {act.observacion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <ConfirmDialog />
      </div>
    </div>
  );
}
