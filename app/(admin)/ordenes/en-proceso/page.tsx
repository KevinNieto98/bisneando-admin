"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Title } from "@/components";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { Table, Column } from "@/components";
import { Save, Search as SearchIcon } from "lucide-react";

type Status = "nueva" | "proceso" | "finalizada";

type Orden = {
  id_orden: string;
  productos: number;
  fecha_creacion: string; // ISO
  total: number;
  colonia: string;
  status: Status;
  canal: string;
  usuario: string;
};

const formatoMoneda = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const formatoFecha = (iso: string) => new Date(iso).toLocaleString();

const DATA_INICIAL: Orden[] = [
  { id_orden: "ORD-1001", productos: 3, fecha_creacion: "2025-08-27T10:05:00Z", total: 1299.9, colonia: "Col. Centro", status: "nueva", canal: "Web", usuario: "Juan Pérez" },
  { id_orden: "ORD-1002", productos: 1, fecha_creacion: "2025-08-27T12:40:00Z", total: 499.0, colonia: "Col. Roma", status: "proceso", canal: "App", usuario: "María López" },
  { id_orden: "ORD-1003", productos: 5, fecha_creacion: "2025-08-26T18:15:00Z", total: 2899.5, colonia: "Col. Del Valle", status: "finalizada", canal: "Tienda", usuario: "Carlos Ruiz" },
  { id_orden: "ORD-1004", productos: 2, fecha_creacion: "2025-08-27T15:20:00Z", total: 899.0, colonia: "Col. Escandón", status: "nueva", canal: "Web", usuario: "Ana Torres" },
];

export default function MenuPrincipal() {
  const searchParams = useSearchParams();
  const estadoParam = searchParams.get("estado"); // "nueva" | "proceso" | "finalizada"
  const [tab, setTab] = useState<"nuevas" | "proceso" | "finalizadas">("proceso");

  const [ordenes, setOrdenes] = useState<Orden[]>(DATA_INICIAL);
  const [draftStatus, setDraftStatus] = useState<Record<string, Status>>({});

  // buscadores por tab
  const [queryNuevas, setQueryNuevas] = useState("");
  const [queryProceso, setQueryProceso] = useState("");
  const [queryFinal, setQueryFinal] = useState("");

  useEffect(() => {
    if (estadoParam === "nueva") setTab("nuevas");
    else if (estadoParam === "finalizada") setTab("finalizadas");
    else if (estadoParam === "proceso") setTab("proceso");
  }, [estadoParam]);

  const applyStatusChange = (id: string, status: Status) => {
    setDraftStatus((prev) => ({ ...prev, [id]: status }));
  };

  const guardarCambios = async () => {
    const idsEditados = Object.keys(draftStatus);
    if (idsEditados.length === 0) return;

    // TODO: POST al backend con draftStatus si aplica
    setOrdenes((prev) =>
      prev.map((o) => (draftStatus[o.id_orden] ? { ...o, status: draftStatus[o.id_orden] } : o))
    );
    setDraftStatus({});
  };

  const hayCambios = Object.keys(draftStatus).length > 0;

  const columnas: Column<Orden>[] = useMemo(
    () => [
      {
        header: "ID Orden",
        align: "left",
        cell: (r) => (
          <Link
            href={`/ordenes/${r.id_orden}`}
            className="text-neutral-900 underline underline-offset-2 hover:opacity-80"
          >
            {r.id_orden}
          </Link>
        ),
      },
      { header: "Productos", align: "center", cell: (r) => r.productos },
      {
        header: "Fecha creación",
        align: "center",
        cell: (r) => <span className="whitespace-nowrap">{formatoFecha(r.fecha_creacion)}</span>,
      },
      { header: "Total", align: "right", cell: (r) => <span className="font-medium">{formatoMoneda(r.total)}</span> },
      { header: "Colonia", align: "left", cell: (r) => r.colonia },
      { header: "Canal", align: "center", cell: (r) => r.canal },
      { header: "Usuario", align: "left", cell: (r) => r.usuario },
      {
        header: "Status",
        align: "center",
        cell: (r) => {
          const actual = draftStatus[r.id_orden] ?? r.status;
          return (
            <select
              value={actual}
              onChange={(e) => applyStatusChange(r.id_orden, e.target.value as Status)}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm"
            >
              <option value="nueva">Nueva</option>
              <option value="proceso">En Proceso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          );
        },
      },
    ],
    [draftStatus]
  );

  const getRowId = (r: Orden) => r.id_orden;

  // helpers de filtro
  const normaliza = (s: string) => s.toLowerCase();
  const coincide = (o: Orden, q: string) => {
    if (!q) return true;
    const t = normaliza(q);
    return (
      normaliza(o.id_orden).includes(t) ||
      normaliza(o.colonia).includes(t) ||
      normaliza(o.usuario).includes(t)
    );
  };

  // datasets por tab (con filtro)
  const dataNuevas = ordenes.filter((o) => o.status === "nueva" && coincide(o, queryNuevas));
  const dataProceso = ordenes.filter((o) => o.status === "proceso" && coincide(o, queryProceso));
  const dataFinal = ordenes.filter((o) => o.status === "finalizada" && coincide(o, queryFinal));

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-6">
      {/* Row: Title */}
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title title="Órdenes en Proceso" subtitle="Menú de órdenes" showBackButton />
        </div>
      </header>

      {/* Row: Toolbar (botón guardar en su propia fila) */}
      <div className="flex items-center justify-end">
        <button
          onClick={guardarCambios}
          disabled={!hayCambios}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-sm text-white hover:bg-blue-800 disabled:opacity-40"
          title={hayCambios ? "Guardar cambios" : "No hay cambios"}
        >
          <Save className="h-4 w-4" />
          Guardar cambios
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nuevas">Órdenes Nuevas</TabsTrigger>
          <TabsTrigger value="proceso">Órdenes en Proceso</TabsTrigger>
          <TabsTrigger value="finalizadas">Órdenes Finalizadas</TabsTrigger>
        </TabsList>

        {/* NUEVAS */}
        <TabsContent value="nuevas">
          {/* buscador */}
          <div className="mt-4">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                value={queryNuevas}
                onChange={(e) => setQueryNuevas(e.target.value)}
                placeholder="Buscar por ID, colonia o usuario…"
                className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
            </div>
          </div>

          <div className="mt-4">
            <Table
              data={dataNuevas}
              columns={columnas}
              getRowId={getRowId}
              emptyText="No hay órdenes nuevas"
              ariaLabel="Tabla de órdenes nuevas"
            />
          </div>
        </TabsContent>

        {/* PROCESO */}
        <TabsContent value="proceso">
          <div className="mt-4">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                value={queryProceso}
                onChange={(e) => setQueryProceso(e.target.value)}
                placeholder="Buscar por ID, colonia o usuario…"
                className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
            </div>
          </div>

          <div className="mt-4">
            <Table
              data={dataProceso}
              columns={columnas}
              getRowId={getRowId}
              emptyText="No hay órdenes en proceso"
              ariaLabel="Tabla de órdenes en proceso"
            />
          </div>
        </TabsContent>

        {/* FINALIZADAS */}
        <TabsContent value="finalizadas">
          <div className="mt-4">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                value={queryFinal}
                onChange={(e) => setQueryFinal(e.target.value)}
                placeholder="Buscar por ID, colonia o usuario…"
                className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
            </div>
          </div>

          <div className="mt-4">
            <Table
              data={dataFinal}
              columns={columnas}
              getRowId={getRowId}
              emptyText="No hay órdenes finalizadas"
              ariaLabel="Tabla de órdenes finalizadas"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
