"use client";

import React from "react";
import { Icono, MenuCard, MenuGrid, StatsCard, Subtitle, Title } from "@/components";
import { ShoppingCart, Loader2, CheckCircle2, Home, Info } from "lucide-react";
import { getMenusAction, MenuRow } from "@/app/actions";

/** Convierte un nombre de ícono (string) en un componente compatible con MenuCard.Icon */
const iconFromName = (name?: string | null) => {
  const safe = name && name.trim().length > 0 ? name : "Menu";
  const Cmp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icono name={safe} {...props} />
  );
  Cmp.displayName = `Icon(${safe})`;
  return Cmp;
};

export  function PageContent() {
  const [menus, setMenus] = React.useState<MenuRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Datos demo (puedes reemplazar por API/DB)
  const stats = { nuevas: 24, enProceso: 57, finalizadas: 120 };

  React.useEffect(() => {
    (async () => {
      try {
        // Cargamos los accesos del menú "PRINCIPAL"
        const data = await getMenusAction("PRINCIPAL");
        setMenus(data);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los accesos rápidos.");
        setMenus([]);
      }
    })();
  }, []);

  const isLoading = menus === null;
  const hasNoResults = !isLoading && !error && (menus?.length ?? 0) === 0;

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

      {/* Tarjetas de estado */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatsCard
          title="Órdenes Nuevas"
          value={stats.nuevas}
          Icon={ShoppingCart}
          href="/ordenes/en-proceso?estado=nueva"
        />
        <StatsCard
          title="Órdenes en Proceso"
          value={stats.enProceso}
          Icon={Loader2}
          href="/ordenes/en-proceso?estado=proceso"
        />
        <StatsCard
          title="Órdenes Finalizadas"
          value={stats.finalizadas}
          Icon={CheckCircle2}
          href="/ordenes/en-proceso?estado=finalizada"
        />
      </section>

      <Subtitle text="Accesos Rápidos" className="pt-1" />

      {/* Loading skeleton */}
      {isLoading && (
        <div
          aria-label="Submenú principal (cargando)"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-3xl border border-neutral-200 bg-neutral-50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <Info className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Empty state */}
      {hasNoResults && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <Info className="h-6 w-6 text-neutral-500" />
          <div className="text-sm text-neutral-600">
            No hay accesos configurados para este menú.
          </div>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !error && !hasNoResults && menus && (
        <MenuGrid count={menus.length}>
          {menus.map(({ id_menu, nombre, subtitulo, href, icon_name }) => (
            <MenuCard
              key={id_menu ?? href}
              title={nombre}
              subtitle={subtitulo ?? ""}
              href={href}
              Icon={iconFromName(icon_name)}
              // accent/ring: si las agregas a la tabla, puedes pasarlas aquí
            />
          ))}
        </MenuGrid>
      )}
    </div>
  );
}
