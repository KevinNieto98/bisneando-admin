"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Boxes, FileSpreadsheet } from "lucide-react";
import { Title } from "@/components";

const menuItems = [
  {
    title: "Inventario",
    subtitle: "Existencias y umbrales",
    href: "/productos/inventario",
    Icon: Boxes,
    accent: "from-amber-500/15 to-amber-500/5",
    ring: "focus-visible:ring-amber-500/40",
  },
  {
    title: "Carga masiva de productos",
    subtitle: "Importa CSV y actualiza por SKU",
    href: "/productos/importar",
    Icon: FileSpreadsheet,
    accent: "from-emerald-500/15 to-emerald-500/5",
    ring: "focus-visible:ring-emerald-500/40",
  },
];

export default function MenuProductos() {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title 
            title="Productos" 
            subtitle="Elige una opción" 
            backHref="/menu"
            showBackButton />
        </div>
      </header>

      <nav aria-label="Menú de productos" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {menuItems.map(({ title, subtitle, href, Icon, accent, ring }) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Link
              href={href}
              className={`group relative block rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden 
                         focus-visible:outline-none ${ring}`}
            >
              <div className={`relative h-28 w-full bg-gradient-to-br ${accent} flex items-center justify-center`}>
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(40rem_40rem_at_120%_-10%,#000,transparent)]" />
                <div className="grid place-items-center rounded-2xl bg-neutral-900/5 backdrop-blur-sm p-4 shadow-inner group-hover:scale-[1.03] transition-transform">
                  <Icon className="h-9 w-9" />
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
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

              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-0 group-hover:ring-2 group-hover:ring-black/5 transition" />
            </Link>
          </motion.div>
        ))}
      </nav>
    </div>
  );
}
