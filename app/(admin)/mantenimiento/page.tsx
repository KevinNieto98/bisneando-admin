"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Users, Package, Wrench } from "lucide-react";
import { Title } from "@/components";

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

export default function MenuPrincipal() {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title title="Menú" subtitle="Accesos rápidos" showBackButton />
        </div>
      </header>

      <nav aria-label="Menú principal" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {menuItems.map(({ title, subtitle, href, Icon, accent, ring }) => (
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

              {/* Borde luminoso al hover */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl 
                              ring-0 group-hover:ring-2 group-hover:ring-black/5 transition" />
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* Variante compacta opcional (por si quieres usarla en un sidebar) */}
      {/*
      <aside className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
        {menuItems.map(({ title, href, Icon }) => (
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
