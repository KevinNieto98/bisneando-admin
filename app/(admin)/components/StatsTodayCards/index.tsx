"use client";

import { StatsCard } from "@/components";
import { ShoppingCart, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export type StatsToday = {
  nuevas: number;
  enProceso: number;
  finalizadas: number;
  problemas: number;
};

type Props = {
  stats: StatsToday;
};

export function StatsTodayCards({ stats }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
        title="Órdenes Finalizadas (hoy)"
        value={stats.finalizadas}
        Icon={CheckCircle2}
        href="/ordenes/en-proceso?estado=finalizada"
      />
      <StatsCard
        title="Órdenes con Problemas (hoy)"
        value={stats.problemas}
        Icon={AlertTriangle}
        href="/ordenes/en-proceso?estado=problema"
      />
    </section>
  );
}
