"use client";

import { Boxes, FileCheck2, FileEdit, FileSpreadsheet } from "lucide-react";
import { MenuCard, MenuGrid, Title } from "@/components";

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
{
  title: "Pendientes",
  subtitle: "Añadele imagenes al producto",
  href: "/productos/pendientes",
  Icon: FileCheck2,   // 👈 mejor transmite "productos incompletos que necesitan edición"
  accent: "from-emerald-500/15 to-emerald-500/5",
  ring: "focus-visible:ring-emerald-500/40",
}
];

export default function MenuProductos() {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title 
            title="Productos" 
            subtitle="Elige una opción" 
            backHref="/"
            showBackButton />
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

    </div>
  );
}
