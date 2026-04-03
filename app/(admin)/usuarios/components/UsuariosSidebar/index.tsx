"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Warehouse, Truck, UserCog, ShieldCheck, UserPlus } from "lucide-react";
import clsx from "clsx";

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

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-800 min-h-full">
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
          className="flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-yellow-300 transition-colors"
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          Nuevo Usuario
        </Link>
      </div>
    </aside>
  );
}
