"use client";

import { Title } from "@/components";
// Dashboard con TailwindCSS (solo light) + lucide-react para iconos
// Reemplaza los datos "stats", "topMasComprados" y "topPorAgotarse" con tu API/DB.

import { ShoppingCart, Loader2, CheckCircle2, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { useRouter } from "next/router";

// Utilidades de formato
const currency = new Intl.NumberFormat("es-HN", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const numberFmt = new Intl.NumberFormat("es-HN");

interface StatsCardProps {
  title: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function StatsCard({ title, value, Icon, href }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-2">
        <p className="text-sm font-medium text-neutral-700">{title}</p>
        <div className="p-2 rounded-2xl bg-neutral-100">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="px-5 pb-4">
        <div className="text-3xl font-bold tracking-tight">{numberFmt.format(value)}</div>
      </div>
      <div className="px-5 pb-5">
        <a
          href={href}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium hover:bg-neutral-100 transition"
        >
          Ir <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function HomePage() {
  // Datos de ejemplo (reemplazar con API/DB)
  const stats = { nuevas: 24, enProceso: 57, finalizadas: 120 };
  const topMasComprados = [
    { sku: "A-001", nombre: "Auriculares Pro X", vendidos: 932, ingresos: 27960 },
    { sku: "B-014", nombre: "Mouse Inalámbrico Neo", vendidos: 811, ingresos: 16220 },
    { sku: "C-203", nombre: "Teclado Mecánico Azul", vendidos: 703, ingresos: 21090 },
    { sku: "D-332", nombre: "Monitor 27'' QHD", vendidos: 655, ingresos: 131000 },
    { sku: "E-113", nombre: "Base Enfriadora Laptop", vendidos: 612, ingresos: 9180 },
    { sku: "F-901", nombre: "USB-C Hub 7 en 1", vendidos: 590, ingresos: 17700 },
    { sku: "G-778", nombre: "SSD NVMe 1TB", vendidos: 566, ingresos: 67920 },
    { sku: "H-456", nombre: "Silla Ergonómica", vendidos: 540, ingresos: 97200 },
    { sku: "I-320", nombre: "Webcam 1080p", vendidos: 512, ingresos: 15360 },
    { sku: "J-219", nombre: "Lámpara LED de Escritorio", vendidos: 498, ingresos: 9960 },
  ];

  const topPorAgotarse = [
    { sku: "K-010", nombre: "Cargador GaN 65W", stock: 12, umbral: 30 },
    { sku: "L-224", nombre: "Router WiFi 6", stock: 18, umbral: 40 },
    { sku: "M-777", nombre: "Batería Externa 20k", stock: 19, umbral: 50 },
    { sku: "N-045", nombre: "Audífonos In-Ear", stock: 21, umbral: 45 },
    { sku: "O-333", nombre: "Funda Universal Tablet", stock: 22, umbral: 35 },
    { sku: "P-098", nombre: "Camera Cover", stock: 24, umbral: 40 },
    { sku: "Q-561", nombre: "Switch HDMI", stock: 26, umbral: 50 },
    { sku: "R-871", nombre: "Soporte Celular Auto", stock: 27, umbral: 60 },
    { sku: "S-402", nombre: "Alfombrilla XL", stock: 28, umbral: 55 },
    { sku: "T-119", nombre: "Organizador Cables", stock: 29, umbral: 50 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 pb-2 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title
            title="Dashboard"
            subtitle="Resumen semanal"
            showBackButton
          />
        </div>
      </header>

      {/* Tarjetas de estado */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Órdenes Nuevas" value={stats.nuevas} Icon={ShoppingCart} href="/ordenes?estado=nueva" />
        <StatsCard title="Órdenes en Proceso" value={stats.enProceso} Icon={Loader2} href="/ordenes?estado=proceso" />
        <StatsCard title="Órdenes Finalizadas" value={stats.finalizadas} Icon={CheckCircle2} href="/ordenes?estado=finalizada" />
      </section>

      {/* Tablas Top 10 */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top más comprados */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-neutral-100"><TrendingUp className="w-5 h-5" /></div>
              <h3 className="font-semibold">Top 10 · Más comprados</h3>
            </div>
            <a href="/productos?sort=vendidos_desc" className="text-sm font-medium text-neutral-700 hover:underline">Ver todos</a>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-600">
                  <th className="w-10 py-2">#</th>
                  <th className="py-2">Producto</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Vendidos</th>
                  <th className="py-2 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {topMasComprados.map((p, i) => (
                  <tr key={p.sku} className="hover:bg-neutral-50/60">
                    <td className="py-2 text-neutral-500">{i + 1}</td>
                    <td className="py-2 font-medium">{p.nombre}</td>
                    <td className="py-2"><span className="px-2 py-0.5 rounded bg-neutral-100 text-xs font-mono">{p.sku}</span></td>
                    <td className="py-2 text-right">{numberFmt.format(p.vendidos)}</td>
                    <td className="py-2 text-right">{currency.format(p.ingresos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top por agotarse */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-neutral-100"><AlertTriangle className="w-5 h-5" /></div>
              <h3 className="font-semibold">Top 10 · Por agotarse</h3>
            </div>
            <a href="/inventario?filter=low-stock" className="text-sm font-medium text-neutral-700 hover:underline">Ver todos</a>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-600">
                  <th className="w-10 py-2">#</th>
                  <th className="py-2">Producto</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Stock</th>
                  <th className="py-2 text-right">Umbral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {topPorAgotarse.map((p, i) => (
                  <tr key={p.sku} className={(p.stock <= p.umbral ? "bg-red-50/60 " : "") + "hover:bg-neutral-50/60"}>
                    <td className="py-2 text-neutral-500">{i + 1}</td>
                    <td className="py-2 font-medium">{p.nombre}</td>
                    <td className="py-2"><span className="px-2 py-0.5 rounded bg-neutral-100 text-xs font-mono">{p.sku}</span></td>
                    <td className="py-2 text-right">{numberFmt.format(p.stock)}</td>
                    <td className="py-2 text-right">{numberFmt.format(p.umbral)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
