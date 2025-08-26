"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Props {
  title: string;
  subtitle: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string; // Ej: "from-emerald-500/15 to-emerald-500/5"
  ring: string;   // Ej: "focus-visible:ring-emerald-500/40"
}

export const MenuCard: React.FC<Props> = ({
  title,
  subtitle,
  href,
  Icon,
  accent,
  ring,
}) => {
  return (
    <motion.div
      key={href}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Link
        href={href}
        className={`group relative block rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden focus-visible:outline-none ${ring}`}
      >
        {/* Cabecera con gradiente */}
        <div
          className={`relative h-20 w-full bg-gradient-to-br ${accent} flex items-center justify-center`}
        >
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(40rem_40rem_at_120%_-10%,#000,transparent)]" />
          <div className="grid place-items-center rounded-2xl bg-neutral-900/5 backdrop-blur-sm p-3 shadow-inner group-hover:scale-[1.03] transition-transform">
            <Icon className="h-8 w-8" />
          </div>
        </div>

        {/* Contenido */}
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
  );
};

export default MenuCard;
