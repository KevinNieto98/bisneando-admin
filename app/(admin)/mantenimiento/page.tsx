"use client";

import { MenuCard, Title } from "@/components";
import {
  ListChecks,
  MapPin,
  Tags,
  Percent,
  CreditCard,
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
  {
    title: "Métodos de pago",
    subtitle: "Gestión de medios de cobro",
    href: "/mantenimiento/metodo-pago",
    Icon: CreditCard,
    accent: "from-blue-500/15 to-blue-500/5",
    ring: "focus-visible:ring-blue-500/40",
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
      </nav>

    </div>
  );
}
