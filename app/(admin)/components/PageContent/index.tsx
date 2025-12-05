// SIN "use client";

import { getMenusAction, type MenuRow } from "@/app/actions";

import { PageContentClient } from "../PageContentClient";
import { getTodayOrdersSummaryAction, TodayOrdersSummary } from "../../ordenes/actions";

export async function PageContent() {
  let menus: MenuRow[] = [];
  let summary: TodayOrdersSummary = {
    nuevas: 0,
    en_proceso: 0,
    finalizadas: 0,
    problemas: 0,
    total: 0,
  };
  let error: string | null = null;

  try {
    const [menusData, summaryData] = await Promise.all([
      getMenusAction("PRINCIPAL"),
      getTodayOrdersSummaryAction(),
    ]);

    menus = menusData ?? [];
    summary = summaryData;
  } catch (e) {
    console.error(e);
    error =
      "No se pudieron cargar los accesos rápidos o el resumen de órdenes.";
  }

  return <PageContentClient menus={menus} summary={summary} error={error} />;
}
