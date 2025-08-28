"use client";

import { use, useMemo, useState } from "react";
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
} from "lucide-react";

import { Title } from "@/components";
import { initialData } from "@/seed/seed";

type OrderStatus = "en_progreso" | "pagada" | "rechazada";

const currency = (n: number) =>
  new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(n);

const maskCard = (last4?: string) => (last4 ? `•••• •••• •••• ${last4}` : "Tarjeta");

const DEFAULT_QTY = 3;

const productsInCart = [
  initialData.products[0],
  initialData.products[1],
  initialData.products[2],
];

const address = {
  label: "Casa - Fernando Herrera",
  name: "Fernando Herrera",
  line1: "Av. Siempre viva 123",
  city: "Ciudad de México",
  state: "CDMX",
  zip: "123123",
  phone: "123.123.123",
};

const mockOrderMeta = (id: string | number) => {
  if (String(id) === "125") {
    return {
      status: "rechazada" as OrderStatus,
      rejectionReason: "El banco rechazó la transacción: fondos insuficientes.",
      payment: { method: "tarjeta" as const, last4: "4242" },
    };
  }
  if (String(id) === "124") {
    return {
      status: "en_progreso" as OrderStatus,
      payment: { method: "efectivo" as const },
    };
  }
  return {
    status: "pagada" as OrderStatus,
    payment: { method: "tarjeta" as const, last4: "1337" },
  };
};

interface Props {
  // En Next 15, params en Client Component es una Promise
  params: Promise<{ id: string }>;
}

export default function OrderReadOnlyPage({ params }: Props) {
  const { id } = use(params);
  const meta = mockOrderMeta(id);

  // 🔹 Estado del formulario de actualización
  const [newStatus, setNewStatus] = useState<OrderStatus>(meta.status);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<"idle" | "ok" | "error">("idle");

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setResult("idle");

      // 👉 Sustituye esto por tu llamada real
      // await fetch(`/api/orders/${id}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ status: newStatus, comment }),
      // });
      await new Promise((r) => setTimeout(r, 600)); // simulación

      setResult("ok");
    } catch (e) {
      console.error(e);
      setResult("error");
    } finally {
      setSaving(false);
    }
  };

  const items = useMemo(
    () =>
      productsInCart.map((p) => {
        const qty = DEFAULT_QTY;
        const price = Number(p.price ?? 0);
        return { ...p, qty, subtotal: price * qty };
      }),
    []
  );

  const summary = useMemo(() => {
    const itemsCount = items.reduce((acc, it) => acc + it.qty, 0);
    const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
    const taxes = Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + taxes) * 100) / 100;
    return { itemsCount, subtotal, taxes, total };
  }, [items]);

  const statusBg =
    meta.status === "pagada"
      ? "bg-emerald-600"
      : meta.status === "en_progreso"
      ? "bg-amber-600"
      : "bg-rose-600";

  return (
    <div className="flex justify-center items-start mb-32 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col w-full max-w-[1100px]">
        {/* 🔹 Título */}
        <div className="flex items-center justify-between mb-6">
          <Title icon={<ClipboardCheck className="w-5 h-5" />} title={`Orden #${id}`} />
        </div>

        {/* 🔹 Apartado: actualizar orden (justo después del título) */}
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

        {/* 🔹 Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-2">
          {/* Columna izquierda: Resumen */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-semibold mb-4">Resumen de orden</h3>

              <div className="rounded-2xl border border-gray-200 p-4 mb-5">
                <p className="font-medium">{address.label}</p>
                <p className="text-sm text-gray-600">{address.name}</p>
                <p className="text-sm text-gray-600">{address.line1}</p>
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state} {address.zip}
                </p>
                <p className="text-sm text-gray-600">{address.phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span>No. Productos</span>
                <span className="text-right">{summary.itemsCount} artículos</span>
                <span>Subtotal</span>
                <span className="text-right">{currency(summary.subtotal)}</span>
                <span>Impuestos (15%)</span>
                <span className="text-right">{currency(summary.taxes)}</span>
                <span className="mt-3 text-lg font-semibold">Total:</span>
                <span className="mt-3 text-lg font-semibold text-right">
                  {currency(summary.total)}
                </span>
              </div>

              <div
                className={`mt-6 w-full flex justify-center items-center gap-2 rounded-xl py-3 text-center text-white font-medium ${statusBg}`}
              >
                {meta.status === "pagada" ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Orden Pagada</span>
                  </>
                ) : meta.status === "en_progreso" ? (
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

              {meta.status === "rechazada" && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                  <p className="text-sm font-medium">Motivo del rechazo</p>
                  <p className="text-sm">{meta.rejectionReason ?? "No especificado."}</p>
                </div>
              )}

              <div className="mt-5">
                <Link
                  href="/ordenes"
                  className="w-full flex justify-center items-center rounded-xl py-3 text-center border border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Regresar
                </Link>
              </div>
            </div>
          </aside>

          {/* Columna derecha: Productos + Pago */}
          <section className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Productos</h2>
              <div className="divide-y">
                {items.map((product) => (
                  <div key={product.slug} className="py-4 flex items-center gap-4">
                    <Image
                      src={`/products/${product.images[0]}`}
                      width={96}
                      height={96}
                      alt={product.title}
                      className="rounded-xl object-cover w-24 h-24"
                    />
                    <div className="flex-1">
                      <p className="font-medium leading-tight">{product.title}</p>
                      <p className="text-sm text-gray-500">
                        {currency(Number(product.price))} x {product.qty}
                      </p>
                      <p className="font-semibold mt-1">
                        Subtotal: {currency(Number(product.subtotal))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-3">Método de pago</h2>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 p-5">
                {meta.payment.method === "tarjeta" ? (
                  <CreditCard className="w-5 h-5" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                <div>
                  <p className="font-semibold">
                    {meta.payment.method === "tarjeta" ? maskCard(meta.payment.last4) : "Efectivo"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {meta.payment.method === "tarjeta"
                      ? "Solo se muestran los últimos 4 dígitos."
                      : "Pago contra entrega."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
