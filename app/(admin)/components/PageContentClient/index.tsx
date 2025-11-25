"use client";

import React from "react";
import {
  Icono,
  MenuCard,
  MenuGrid,
  StatsCard, // lo sigues usando en otros lados si quieres
  Subtitle,
  Title,
} from "@/components";
import { Home, Info } from "lucide-react";

import type { MenuRow } from "@/app/actions";
import { StatsTodayCards } from "../StatsTodayCards";
import { TodayOrdersSummary } from "../../ordenes/actions";

/** Convierte un nombre de ícono (string) en un componente compatible con MenuCard.Icon */
const iconFromName = (name?: string | null) => {
  const safe = name && name.trim().length > 0 ? name : "Menu";
  const Cmp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icono name={safe} {...props} />
  );
  Cmp.displayName = `Icon(${safe})`;
  return Cmp;
};

type PageContentClientProps = {
  menus: MenuRow[];
  summary: TodayOrdersSummary;
  error?: string | null;
};

export function PageContentClient({
  menus,
  summary,
  error,
}: PageContentClientProps) {
  const stats = {
    nuevas: summary.nuevas,
    enProceso: summary.en_proceso,
    finalizadas: summary.finalizadas,
  };

  const hasNoResults = !error && menus.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-5 pb-0 space-y-6">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title
            title="Menú Principal"
            subtitle="¡Bienvenido de nuevo!"
            icon={<Home className="h-5 w-5" />}
          />
        </div>
      </header>

      {/* Tarjetas de estado con totales de HOY */}
      <StatsTodayCards stats={stats} />

      <Subtitle text="Accesos Rápidos" className="pt-1" />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <Info className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Empty state */}
      {!error && hasNoResults && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <Info className="h-6 w-6 text-neutral-500" />
          <div className="text-sm text-neutral-600">
            No hay accesos configurados para este menú.
          </div>
        </div>
      )}

      {/* Grid de accesos */}
      {!error && !hasNoResults && menus && (
        <MenuGrid count={menus.length}>
          {menus.map(({ id_menu, nombre, subtitulo, href, icon_name }) => (
            <MenuCard
              key={id_menu ?? href}
              title={nombre}
              subtitle={subtitulo ?? ""}
              href={href}
              Icon={iconFromName(icon_name)}
            />
          ))}
        </MenuGrid>
      )}
    </div>
  );
}
