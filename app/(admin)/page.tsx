"use client";

import { Subtitle, Title } from "@/components";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Users,
  Package,
  Wrench,
  Home,
} from "lucide-react";
import Link from "next/link";
import React from "react";

const numberFmt = new Intl.NumberFormat("es-HN");

// Puedes mover esto a un archivo de config si quieres reutilizarlo
const menuItems = [
  {
    title: "Órdenes",
    subtitle: "Gestiona y rastrea pedidos",
    href: "/ordenes",
    Icon: ShoppingCart,
    accent: "from-emerald-500/15 to-emerald-500/5",
    ring: "focus-visible:ring-emerald-500/40",
  },
  {
    title: "Usuarios",
    subtitle: "Crea, edita y asigna roles",
    href: "/usuarios",
    Icon: Users,
    accent: "from-blue-500/15 to-blue-500/5",
    ring: "focus-visible:ring-blue-500/40",
  },
  {
    title: "Productos",
    subtitle: "Catálogo, precios y stock",
    href: "/productos",
    Icon: Package,
    accent: "from-amber-500/15 to-amber-500/5",
    ring: "focus-visible:ring-amber-500/40",
  },
  {
    title: "Mantenimiento",
    subtitle: "Tareas y utilidades del sistema",
    href: "/mantenimiento",
    Icon: Wrench,
    accent: "from-fuchsia-500/15 to-fuchsia-500/5",
    ring: "focus-visible:ring-fuchsia-500/40",
  },
];

interface StatsCardProps {
  title: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function StatsCard({ title, value, Icon, href }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-1.5">
        <p className="text-sm font-medium text-neutral-700">{title}</p>
        <div className="p-1.5 rounded-2xl bg-neutral-100">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="text-2xl font-bold tracking-tight">
          {numberFmt.format(value)}
        </div>
      </div>
      <div className="px-4 pb-4">
        <a
          href={href}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm font-medium hover:bg-neutral-100 transition"
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

  return (
    <div className="max-w-7xl mx-auto px-5 pb-0 space-y-6">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title 
            title="Menu Principal"
              subtitle="Bienvenido de nuevo!"
            icon={<Home className="h-5 w-5" />} 
          />
        </div>
      </header>

      {/* Tarjetas de estado (más compacto y mejor uso del ancho) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatsCard
          title="Órdenes Nuevas"
          value={stats.nuevas}
          Icon={ShoppingCart}
          href="/ordenes?estado=nueva"
        />
        <StatsCard
          title="Órdenes en Proceso"
          value={stats.enProceso}
          Icon={Loader2}
          href="/ordenes?estado=proceso"
        />
        <StatsCard
          title="Órdenes Finalizadas"
          value={stats.finalizadas}
          Icon={CheckCircle2}
          href="/ordenes?estado=finalizada"
        />
      </section>
      <Subtitle text="Accesos Rápidos" className="pt-1" />
      {/* Menú principal (tarjetas más bajas y paddings reducidos) */}
      <nav
        aria-label="Menú principal"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5"
      >
        {menuItems.map(({ title, subtitle, href, Icon, accent, ring }) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Link
              href={href}
              className={`group block rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden focus-visible:outline-none ${ring}`}
            >
              <div
                className={`relative h-20 w-full bg-gradient-to-br ${accent} flex items-center justify-center`}
              >
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(40rem_40rem_at_120%_-10%,#000,transparent)]" />
                <div className="grid place-items-center rounded-2xl bg-neutral-900/5 backdrop-blur-sm p-3 shadow-inner group-hover:scale-[1.03] transition-transform">
                  <Icon className="h-8 w-8" />
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-base font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>

                <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                  Entrar
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Borde luminoso al hover */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-0 group-hover:ring-2 group-hover:ring-black/5 transition" />
            </Link>
          </motion.div>
        ))}
      </nav>
    </div>
  );
}
