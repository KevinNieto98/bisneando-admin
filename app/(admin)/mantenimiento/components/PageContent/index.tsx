"use client";

import React from "react";
import { Icono, MenuCard, Title } from "@/components";
import { Info, Wrench } from "lucide-react";
import { getMenusAction, type MenuRow } from "@/app/actions";

/** Convierte un nombre de ícono (string) en un componente compatible con MenuCard.Icon */
const iconFromName = (name?: string | null) => {
  const fallback = "Wrench"; // ícono por defecto para mantenimiento
  const safe = name && name.trim().length > 0 ? name : fallback;
  const Cmp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icono name={safe} {...props} />
  );
  Cmp.displayName = `Icon(${safe})`;
  return Cmp;
};

export  function PageContent() {
  const [menus, setMenus] = React.useState<MenuRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        // 👇 Cargamos los accesos del menú "MANTENIMIENTO"
        const data = await getMenusAction("MANTENIMIENTO");
        setMenus(data);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los accesos de Mantenimiento.");
        setMenus([]);
      }
    })();
  }, []);

  const isLoading = menus === null;
  const hasNoResults = !isLoading && !error && (menus?.length ?? 0) === 0;

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title
            title="Mantenimiento"
            subtitle="Configuraciones del sistema"
            showBackButton
            backHref="/"
            // icon={<Wrench className="h-5 w-5" />} // opcional si tu Title soporta icon
          />
        </div>
      </header>

      {/* Loading */}
      {isLoading && (
        <nav
          aria-label="Submenú de Mantenimiento (cargando)"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-3xl border border-neutral-200 bg-neutral-50 animate-pulse"
            />
          ))}
        </nav>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <Info className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Estado vacío */}
      {hasNoResults && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <Info className="h-6 w-6 text-neutral-500" />
          <div className="text-sm text-neutral-600">
            Aún no hay accesos configurados para el menú de Mantenimiento.
          </div>
        </div>
      )}

      {/* Grid con datos */}
      {!isLoading && !error && !hasNoResults && menus && (
        <nav
          aria-label="Submenú de Mantenimiento"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {menus.map(({ id_menu, nombre, subtitulo, href, icon_name }) => (
            <MenuCard
              key={id_menu ?? href}
              title={nombre}
              subtitle={subtitulo ?? ""}
              href={href}
              Icon={iconFromName(icon_name)}
              // Si luego agregas columnas "accent" y "ring" en la tabla,
              // puedes pasarlas como props aquí.
            />
          ))}
        </nav>
      )}
    </div>
  );
}
