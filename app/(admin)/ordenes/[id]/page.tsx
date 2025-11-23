"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  ClipboardCheck,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

import { Title } from "@/components";
import { getOrderByIdAction } from "../actions";

/* =====================
   Tipos de la orden
   ===================== */

type OrderStatus = "en_progreso" | "pagada" | "rechazada";

// Derivamos el tipo exacto de la server action
type FullOrderByIdResult = NonNullable<Awaited<ReturnType<typeof getOrderByIdAction>>>;

const currency = (n: number) =>
  new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(n);

const maskCard = (last4?: string) => (last4 ? `•••• •••• •••• ${last4}` : "Tarjeta");

/* =====================
   Helpers
   ===================== */

function mapDbStatusToUiStatus(id_status: number | null): OrderStatus {
  // 👉 Ajusta estos mapeos según tu catálogo real
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
   Página principal
   ===================== */

interface Props {
  // En Next 15, params en Client Component es una Promise
  params: Promise<{ id: string }>;
}

export default function OrderReadOnlyPage({ params }: Props) {
  const { id } = use(params);

  const [order, setOrder] = useState<FullOrderByIdResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 🔹 Estado del formulario de actualización
  const [newStatus, setNewStatus] = useState<OrderStatus>("en_progreso");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<"idle" | "ok" | "error">("idle");

  // Cargar orden al montar / cambiar id, usando la server action
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
        // Mapear status inicial para el formulario
        setNewStatus(mapDbStatusToUiStatus(data.head.id_status));
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

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setResult("idle");

      // 👉 Aquí deberías llamar tu acción real (server action / API / lo que uses)
      // await updateOrderStatusAction({ id_order: Number(id), status: newStatus, comment });

      await new Promise((r) => setTimeout(r, 600)); // simulación

      setResult("ok");
    } catch (e) {
      console.error(e);
      setResult("error");
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return <OrderPageSkeleton />;
  }

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

  // Orden cerrada si id_status es 5 o 6
  const isClosed = order.head.id_status === 5 || order.head.id_status === 6;

  const uiStatus = mapDbStatusToUiStatus(order.head.id_status);

  const statusBg =
    uiStatus === "pagada"
      ? "bg-emerald-600"
      : uiStatus === "en_progreso"
      ? "bg-amber-600"
      : "bg-rose-600";

  // payment mock básico en base al id_metodo (ajusta a tu lógica)
const payment =
  order.head.id_metodo === 1
    ? { method: "efectivo" as const }
    : { method: "tarjeta" as const, last4: "0000" };

  // Si está rechazada, tomamos el último registro de activity con observación como razón
  const lastActivity = order.activity[0];
  const rejectionReason =
    uiStatus === "rechazada"
      ? lastActivity?.observacion ?? order.head.observacion ?? "No especificado."
      : undefined;

  // Parseo de latitud/longitud y bandera para mostrar mapa
  const lat = order.head.latitud ? Number(order.head.latitud) : null;
  const lng = order.head.longitud ? Number(order.head.longitud) : null;
  const hasCoords =
    lat !== null && !Number.isNaN(lat) && lng !== null && !Number.isNaN(lng);

  return (
    <div className="flex justify-center items-start mb-32 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col w-full max-w-[1100px]">
        {/* 🔹 Título */}
        <div className="flex items-center justify-between mb-6">
          <Title
            icon={<ClipboardCheck className="w-5 h-5" />}
            title={`Orden #${order.head.id_order}`}
            subtitle="Detalle de orden"
            showBackButton
          />
        </div>

        {/* 🔹 Apartado: actualizar orden (solo si NO está cerrada) */}
        {!isClosed && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Actualizar estado de la orden</h2>

            {/* Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nuevo estado
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="en_progreso">En progreso</option>
                <option value="pagada">Pagada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>

            {/* Comentario */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Escribe un comentario sobre la actualización..."
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>

            {/* Botón */}
            <button
              onClick={handleUpdate}
              disabled={saving}
              className={`w-full rounded-xl py-3 font-medium text-white ${
                saving ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
              }`}
            >
              {saving ? "Actualizando..." : "Actualizar Orden"}
            </button>

            {/* Mensajes */}
            {result === "ok" && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
                ¡Orden actualizada correctamente!
              </div>
            )}
            {result === "error" && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                Ocurrió un error al actualizar. Inténtalo de nuevo.
              </div>
            )}
          </div>
        )}

        {/* 🔹 Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-2">
          {/* Columna izquierda: Resumen */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-semibold mb-4">Resumen de orden</h3>

              <div className="rounded-2xl border border-gray-200 p-4 mb-5 text-sm">
                <p className="font-medium mb-1">Cliente / UID</p>

                {/* UID */}
                <p className="text-gray-700 break-all text-xs">
                  {order.head.uid}
                </p>

                {/* Link al usuario si tenemos nombre */}
                {order.head.usuario && (
                  <Link
                    href={`/usuarios/${order.head.uid}`}
                    className="mt-1 inline-flex text-sm text-blue-600 hover:underline"
                  >
                    {order.head.usuario}
                  </Link>
                )}

                <p className="mt-2 text-gray-600">
                  Colonia <span className="font-medium">{order.head.nombre_colonia ?? "-"}</span>
                </p>
                <p className="text-gray-600">
                  RTN: <span className="font-medium">{order.head.rtn ?? "-"}</span>
                </p>
                <p className="text-gray-600">
                  Lat/Lng:{" "}
                  <span className="font-medium">
                    {order.head.latitud ?? "-"} / {order.head.longitud ?? "-"}
                  </span>
                </p>

                {/* 🔹 Mapa con la ubicación, solo si hay coordenadas válidas */}
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
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                  <p className="text-sm font-medium">Motivo del rechazo</p>
                  <p className="text-sm">{rejectionReason}</p>
                </div>
              )}
            </div>
          </aside>

          {/* Columna derecha: Detalle + Pago + Activity */}
          <section className="lg:col-span-2 space-y-6">
            {/* Detalle productos (en forma de tabla simple) */}
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
                        <th className="py-2 text-right font-medium text-gray-600">Cantidad</th>
                        <th className="py-2 text-right font-medium text-gray-600">Precio</th>
                        <th className="py-2 text-right font-medium text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.det.map((row) => (
                        <tr key={row.id_det} className="border-b last:border-b-0">
                          <td className="py-2">
                            <span className="font-medium">#{row.id_producto}</span>
                          </td>
                          <td className="py-2 text-right">{row.qty}</td>
                          <td className="py-2 text-right">{currency(Number(row.precio))}</td>
                          <td className="py-2 text-right">
                            {currency(Number(row.sub_total ?? row.qty * row.precio))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-3">Método de pago</h2>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 p-5">
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

            {/* 🔹 Tablita de activity */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Historial de actividad</h2>
              {order.activity.length === 0 ? (
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
                      {order.activity.map((act) => (
                        <tr key={act.id_act} className="border-b last:border-b-0">
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
                              (act.id_status != null ? `#${act.id_status}` : "-")}
                          </td>
                          <td className="py-2 align-top">
                            {act.usuario_actualiza ?? order.head.usuario_actualiza ?? "-"}
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
      </div>
    </div>
  );
}
