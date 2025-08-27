"use client";


import { ShoppingCart,  History } from "lucide-react";
import { MenuCard, MenuGrid, Title } from "@/components";

// Puedes mover esto a un archivo de config si quieres reutilizarlo
const menuItems = [
  {
    title: "Órdenes en proceso",
    subtitle: "Gestiona y rastrea pedidos",
    href: "ordenes/en-proceso",
    Icon: ShoppingCart, // 🛒 Carrito = pedidos en curso
    accent: "from-emerald-500/15 to-emerald-500/5",
    ring: "focus-visible:ring-emerald-500/40",
  },
  {
    title: "Histórico de Órdenes",
    subtitle: "Ver órdenes pasadas",
    href: "ordenes/historico",
    Icon: History, // ⏱ Reloj/histórico = registros anteriores
    accent: "from-blue-500/15 to-blue-500/5",
    ring: "focus-visible:ring-blue-500/40",
  },
];

export default function MenuPrincipal() {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title title="Ordenes" subtitle="Menu de ordenes" showBackButton />
        </div>
      </header>

      <MenuGrid count={menuItems.length}>
        {menuItems.map(({ title, subtitle, href, Icon, accent, ring }) => (
          <MenuCard
            key={href}
            title={title}
            subtitle={subtitle}
            href={href}
            Icon={Icon}
            accent={accent}
            ring={ring}
          />
        ))}
      </MenuGrid>

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
