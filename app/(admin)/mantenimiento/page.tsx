"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Title } from "@/components";
import {
  ListChecks,
  MapPin,
  Tags,
  Percent,
} from "lucide-react";

type Item = {
  title: string;
  subtitle: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  ring: string;
};

const mantenimientoItems: Item[] = [
  {
    title: "Ajustes Factura",
    subtitle: "Descuentos e impuestos",
    href: "/mantenimiento/ajustes-factura",
    Icon: Percent,
    accent: "from-emerald-500/15 to-emerald-500/5",
    ring: "focus-visible:ring-emerald-500/40",
  },
  {
    title: "Status de pedidos",
    subtitle: "Estados, flujos y visibilidad",
    href: "/mantenimiento/status-pedidos",
    Icon: ListChecks,
    accent: "from-violet-500/15 to-violet-500/5",
    ring: "focus-visible:ring-violet-500/40",
  },
  {
    title: "Colonias",
    subtitle: "Zonas de entrega y catálogos",
    href: "/mantenimiento/colonias",
    Icon: MapPin,
    accent: "from-amber-500/15 to-amber-500/5",
    ring: "focus-visible:ring-amber-500/40",
  },
  {
    title: "Marcas",
    subtitle: "Catálogo y asignaciones",
    href: "/mantenimiento/marcas",
    Icon: Tags,
    accent: "from-rose-500/15 to-rose-500/5",
    ring: "focus-visible:ring-rose-500/40",
  },
];

export default function MantenimientoPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title 
            title="Mantenimiento" 
            subtitle="Configuraciones del sistema" 
            showBackButton 
            backHref="/"
          />
        </div>
      </header>

      <nav aria-label="Submenú de Mantenimiento" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {mantenimientoItems.map(({ title, subtitle, href, Icon, accent, ring }) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Link
              href={href}
              className={`group block rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden 
                         focus-visible:outline-none ${ring}`}
            >
              <div
                className={`relative h-28 w-full bg-gradient-to-br ${accent} 
                            flex items-center justify-center`}
              >
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(40rem_40rem_at_120%_-10%,#000,transparent)]"/>
                <div className="grid place-items-center rounded-2xl bg-neutral-900/5 backdrop-blur-sm p-4 
                                shadow-inner group-hover:scale-[1.03] transition-transform">
                  <Icon className="h-9 w-9" />
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-700 ">
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

              <div className="pointer-events-none absolute inset-0 rounded-3xl 
                              ring-0 group-hover:ring-2 group-hover:ring-black/5 transition" />
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* Variante compacta opcional (sidebar) */}
      {/* 
      <aside className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
        {mantenimientoItems.map(({ title, href, Icon }) => (
          <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl p-3 border border-neutral-200 bg-white">
            <span className="grid place-items-center rounded-xl bg-neutral-100 p-2">
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-medium">{title}</span>
          </Link>
        ))}
      </aside>
      */}
    </div>
  );
}
