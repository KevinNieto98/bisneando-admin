"use client";

import { StatsCard } from "@/components";
import { ShoppingCart, Loader2, CheckCircle2 } from "lucide-react";

export type StatsToday = {
  nuevas: number;
  enProceso: number;
  finalizadas: number;
};

type Props = {
  stats: StatsToday;
};

export function StatsTodayCards({ stats }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <StatsCard
        title="Órdenes Nuevas (hoy)"
        value={stats.nuevas}
        Icon={ShoppingCart}
        href="/ordenes/en-proceso?estado=nueva"
      />

      <StatsCard
        title="Órdenes en Proceso (hoy)"
        value={stats.enProceso}
        Icon={Loader2}
        href="/ordenes/en-proceso?estado=proceso"
      />

      <StatsCard
        title="Órdenes Finalizadas (hoy)"
        value={stats.finalizadas}
        Icon={CheckCircle2}
        href="/ordenes/en-proceso?estado=finalizada"
      />
    </section>
  );
}
