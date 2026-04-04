"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Warehouse, Truck, UserCog, ShieldCheck, UserPlus, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

const navItems = [
  {
    label: "Clientes",
    href: "/usuarios",
    icon: Users,
    exact: true,
  },
  {
    label: "Administradores",
    href: "/usuarios/administradores",
    icon: ShieldCheck,
  },
  {
    label: "Bodegas",
    href: "/usuarios/bodegas",
    icon: Warehouse,
  },
  {
    label: "Deliveries",
    href: "/usuarios/deliveries",
    icon: Truck,
  },
  {
    label: "Perfiles",
    href: "/usuarios/perfiles",
    icon: UserCog,
  },
];

export function UsuariosSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <p className="px-4 pt-6 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Usuarios
      </p>
      <nav className="flex flex-col gap-0.5 px-2 pb-4">
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-5">
        <Link
          href="/usuarios/crear"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-yellow-300 transition-colors"
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          Nuevo Usuario
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-800 min-h-full">
        <NavLinks />
      </aside>

      {/* Botón flotante mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-5 left-4 z-40 flex items-center gap-2 rounded-full bg-slate-800 px-4 py-3 text-white shadow-lg"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
        <span className="text-sm font-semibold">Menú</span>
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer mobile */}
      <aside
        className={clsx(
          "md:hidden fixed top-0 left-0 z-50 h-full w-64 flex flex-col bg-slate-800 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Usuarios</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 pb-4">
          {navItems.map(({ label, href, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-3 pb-5">
          <Link
            href="/usuarios/crear"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-yellow-300 transition-colors"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            Nuevo Usuario
          </Link>
        </div>
      </aside>
    </>
  );
}
