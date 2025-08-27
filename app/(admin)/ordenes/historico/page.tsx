"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Title } from "@/components";
import { Table, Column } from "@/components";
import { Search as SearchIcon, XCircle } from "lucide-react";

type Status = "nueva" | "proceso" | "finalizada";

type Orden = {
  id_orden: string;
  productos: number;
  fecha_creacion: string; // ISO
  total: number;
  colonia: string;
  status: Status;
  canal: string;  // Web | App | Tienda | ...
  usuario: string;
};

// helpers
const formatoMoneda = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const formatoFecha = (iso: string) => new Date(iso).toLocaleString();

const DATA: Orden[] = [
  { id_orden: "ORD-1010", productos: 2, fecha_creacion:  "2025-08-27T18:15:00.000Z", total: 799, colonia: "Col. Centro", status: "nueva", canal: "Web", usuario: "Juan Pérez" },
  { id_orden: "ORD-1009", productos: 1, fecha_creacion:  "2025-08-27T18:15:00.000Z", total: 199, colonia: "Col. Roma", status: "proceso", canal: "App", usuario: "María López" },
  { id_orden: "ORD-1008", productos: 4, fecha_creacion: "2025-08-27T18:15:00.000Z", total: 1599, colonia: "Col. Del Valle", status: "finalizada", canal: "Tienda", usuario: "Carlos Ruiz" },
  { id_orden: "ORD-1007", productos: 3, fecha_creacion: "2025-08-27T18:15:00.000Z", total: 1249, colonia: "Col. Escandón", status: "nueva", canal: "Web", usuario: "Ana Torres" },
  { id_orden: "ORD-1006", productos: 6, fecha_creacion: "2025-08-27T18:15:00.000Z", total: 3299, colonia: "Col. Nápoles", status: "proceso", canal: "App", usuario: "Luis Gómez" },
  { id_orden: "ORD-1005", productos: 1, fecha_creacion: "2025-08-27T18:15:00.000Z", total: 349, colonia: "Col. Condesa", status: "finalizada", canal: "Tienda", usuario: "Sofía Díaz" },
  { id_orden: "ORD-1004", productos: 5, fecha_creacion: "2025-08-27T18:15:00.000Z", total: 2599, colonia: "Col. Juárez", status: "proceso", canal: "Web", usuario: "Pablo Méndez" },
  { id_orden: "ORD-1003", productos: 2, fecha_creacion: "2025-08-27T18:15:00.000Z", total: 899, colonia: "Col. Coyoacán", status: "finalizada", canal: "App", usuario: "Daniela Ríos" },
];

export default function HistoricoOrdenesPage() {
  // filtros
  const [query, setQuery] = useState("");
  const [canal, setCanal] = useState<string>("todos");
  const [rango, setRango] = useState<"todo" | "1d" | "1w" | "1m">("todo");

  // opciones de canal (dinámicas)
  const canales = useMemo(() => {
    const set = new Set(DATA.map(d => d.canal));
    return ["todos", ...Array.from(set)];
  }, []);

  // columnas para la tabla
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
      { header: "Fecha creación", align: "center", cell: (r) => <span className="whitespace-nowrap">{formatoFecha(r.fecha_creacion)}</span> },
      { header: "Total", align: "right", cell: (r) => <span className="font-medium">{formatoMoneda(r.total)}</span> },
      { header: "Colonia", align: "left", cell: (r) => r.colonia },
      { header: "Canal", align: "center", cell: (r) => r.canal },
      { header: "Usuario", align: "left", cell: (r) => r.usuario },
      {
        header: "Estado",
        align: "center",
        cell: (r) => (
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
              (r.status === "nueva"
                ? "bg-blue-100 text-blue-800"
                : r.status === "proceso"
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800")
            }
          >
            {r.status}
          </span>
        ),
      },
    ],
    []
  );

  const getRowId = (r: Orden) => r.id_orden;

  // lógica de filtros
  const filtraTexto = (o: Orden) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      o.id_orden.toLowerCase().includes(q) ||
      o.colonia.toLowerCase().includes(q) ||
      o.usuario.toLowerCase().includes(q) ||
      o.canal.toLowerCase().includes(q)
    );
  };

  const filtraCanal = (o: Orden) => canal === "todos" || o.canal === canal;

  const filtraRango = (o: Orden) => {
    if (rango === "todo") return true;
    const ahora = Date.now();
    let limite = 0;
    if (rango === "1d") limite = ahora - 1 * 24 * 60 * 60 * 1000;
    if (rango === "1w") limite = ahora - 7 * 24 * 60 * 60 * 1000;
    if (rango === "1m") limite = ahora - 30 * 24 * 60 * 60 * 1000;
    return new Date(o.fecha_creacion).getTime() >= limite;
  };

  const dataFiltrada = DATA.filter((o) => filtraTexto(o) && filtraCanal(o) && filtraRango(o));

  const borrarFiltros = () => {
    setQuery("");
    setCanal("todos");
    setRango("todo");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-6">
      {/* Título */}
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title
            title="Histórico de Órdenes"
            subtitle="Consulta, filtra y busca órdenes pasadas"
            showBackButton
            backHref="/ordenes"
          />
        </div>
      </header>

      {/* Toolbar de filtros */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Buscador */}
          <div className="relative w-full md:max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por ID, colonia, usuario o canal…"
              className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>

          {/* Filtros derechos */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Canal */}
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
              title="Filtrar por canal"
            >
              {canales.map((c) => (
                <option key={c} value={c}>
                  {c === "todos" ? "Todos los canales" : c}
                </option>
              ))}
            </select>

            {/* Rango de fechas (segmentado simple) */}
            <div className="inline-flex rounded-xl border border-neutral-300 p-1">
              <button
                onClick={() => setRango("todo")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  rango === "todo" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                }`}
              >
                Todo
              </button>
              <button
                onClick={() => setRango("1d")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  rango === "1d" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                }`}
              >
                1 día
              </button>
              <button
                onClick={() => setRango("1w")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  rango === "1w" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                }`}
              >
                1 semana
              </button>
              <button
                onClick={() => setRango("1m")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  rango === "1m" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                }`}
              >
                1 mes
              </button>
            </div>

            {/* Borrar filtros */}
            <button
              onClick={borrarFiltros}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              title="Borrar filtros"
            >
              <XCircle className="h-4 w-4" />
              Borrar filtros
            </button>
          </div>
        </div>
      </section>

      {/* Tabla */}
      <section>
        <Table
          data={dataFiltrada}
          columns={columnas}
          getRowId={(r) => r.id_orden}
          emptyText="No hay órdenes en el rango/criterio seleccionado."
          ariaLabel="Tabla histórico de órdenes"
          className="bg-white"
        />
      </section>
    </div>
  );
}
