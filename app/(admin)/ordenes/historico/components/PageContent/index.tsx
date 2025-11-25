"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Title, Table, Column, Pagination } from "@/components";
import { Search as SearchIcon, Download, LucideDatabaseBackup } from "lucide-react";
import { getOrdersHeadAction, OrderHead } from "../../../actions";

type StatusUI = "nueva" | "proceso" | "finalizada";

type Orden = {
  id_orden: string;
  uid: string;
  productos: number;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
  total: number;
  colonia: string;
  id_status: number;
  status: string;
  usuario: string;
  metodo_pago: string;
  uiStatus: StatusUI;
};

const formatoMoneda = (n: number) =>
  new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
  }).format(n);

const formatoFecha = (iso: string) => new Date(iso).toLocaleString();

const mapStatus = (id_status: number): StatusUI => {
  if (id_status === 1) return "nueva";
  if (id_status >= 2 && id_status <= 4) return "proceso";
  if (id_status === 5 || id_status === 6) return "finalizada";
  return "finalizada";
};

const mapOrderHeadToOrden = (o: OrderHead): Orden => {
  const id_status = o.id_status ?? 1;
  return {
    id_orden: String(o.id_order),
    uid: o.uid,
    productos: o.qty,
    fecha_creacion: o.fecha_creacion ?? new Date().toISOString(),
    fecha_actualizacion: (o as any).fecha_actualizacion ?? null,
    total: o.total,
    colonia: o.nombre_colonia ?? "Sin colonia",
    usuario: o.usuario ?? "sin-usuario",
    metodo_pago: o.metodo_pago ?? "Sin método",
    status: o.status ?? "Sin estado",
    id_status,
    uiStatus: mapStatus(id_status),
  };
};

const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
};

const isOlderThanOneDay = (iso?: string | null) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Date.now() - t > 24 * 60 * 60 * 1000;
};

const getMonthKey = (iso: string) => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const monthLabelEs = (key: string) => {
  const [y, m] = key.split("-");
  const monthNum = Number(m) - 1;
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];
  const nombreMes = meses[monthNum] ?? key;
  return `${nombreMes} ${y}`;
};

const sortByUpdatedNewest = (a: Orden, b: Orden) => {
  const ta = new Date(a.fecha_actualizacion ?? a.fecha_creacion).getTime();
  const tb = new Date(b.fecha_actualizacion ?? b.fecha_creacion).getTime();
  return tb - ta;
};

const esRechazada = (o: Orden) => o.id_status === 6;
const esCompletada = (o: Orden) => o.id_status === 5;

type FiltroEstado = "todas" | "rechazadas" | "completadas";

export function PageContent() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const currentMonthKey = useMemo(() => getMonthKey(new Date().toISOString()), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");

  const [now, setNow] = useState<number | null>(null);

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows = await getOrdersHeadAction();
        setOrdenes(rows.map(mapOrderHeadToOrden));
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Error al cargar órdenes");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const columnas: Column<Orden>[] = useMemo(
    () => [
      {
        header: "ID Orden",
        align: "left",
        cell: (r) => (
          <Link href={`/ordenes/${r.id_orden}`} className="text-neutral-900 underline">
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
      {
        header: "Fecha actualización",
        align: "center",
        cell: (r) =>
          r.fecha_actualizacion ? (
            <span className="whitespace-nowrap">
              {formatoFecha(r.fecha_actualizacion)}
            </span>
          ) : (
            <span className="text-xs text-neutral-400">--</span>
          ),
      },
      {
        header: "Total",
        align: "right",
        cell: (r) => <span className="font-medium">{formatoMoneda(r.total)}</span>,
      },
      { header: "Colonia", align: "left", cell: (r) => r.colonia },
      { header: "Usuario", align: "left", cell: (r) => r.usuario },
      {
        header: "Método de pago",
        align: "center",
        cell: (r) => (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800">
            {r.metodo_pago || "N/A"}
          </span>
        ),
      },
      {
        header: "Tiempo en bandeja",
        align: "center",
        cell: (r) => {
          if (!now) return "--";
          const diff = now - new Date(r.fecha_creacion).getTime();
          return (
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
              {formatDuration(diff)}
            </span>
          );
        },
      },
      {
        header: "Estado",
        align: "center",
        cell: (r) => {
          const base =
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ";
          const cls = esRechazada(r)
            ? "bg-red-100 text-red-800"
            : esCompletada(r)
            ? "bg-emerald-100 text-emerald-800"
            : "bg-amber-100 text-amber-800";
          return <span className={base + cls}>{r.status}</span>;
        },
      },
    ],
    [now]
  );

  const getRowId = (r: Orden) => r.id_orden;

  const monthOptions = useMemo(() => {
    const set = new Set<string>();

    ordenes.forEach((o) => {
      if (o.uiStatus !== "finalizada") return;
      const base = o.fecha_actualizacion ?? o.fecha_creacion;
      if (!isOlderThanOneDay(base)) return;
      set.add(getMonthKey(base));
    });

    const arr = Array.from(set);
    arr.sort((a, b) => (a < b ? 1 : -1));

    if (!arr.includes(currentMonthKey)) arr.unshift(currentMonthKey);

    return arr;
  }, [ordenes, currentMonthKey]);

  const filtraTexto = (o: Orden) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      o.id_orden.toLowerCase().includes(q) ||
      o.colonia.toLowerCase().includes(q) ||
      o.usuario.toLowerCase().includes(q)
    );
  };

  const filtraMes = (o: Orden) =>
    getMonthKey(o.fecha_actualizacion ?? o.fecha_creacion) === selectedMonth;

  const filtraEstado = (o: Orden) => {
    if (filtroEstado === "todas") return true;
    if (filtroEstado === "rechazadas") return esRechazada(o);
    if (filtroEstado === "completadas") return esCompletada(o);
    return true;
  };

  const dataFiltrada = useMemo(
    () =>
      ordenes
        .filter(
          (o) =>
            o.uiStatus === "finalizada" &&
            isOlderThanOneDay(o.fecha_actualizacion ?? o.fecha_creacion) &&
            filtraMes(o) &&
            filtraEstado(o) &&
            filtraTexto(o)
        )
        .sort(sortByUpdatedNewest),
    [ordenes, selectedMonth, filtroEstado, query]
  );

  const totalPages = Math.max(1, Math.ceil(dataFiltrada.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return dataFiltrada.slice(start, start + PAGE_SIZE);
  }, [dataFiltrada, currentPage]);

  const handleExport = () => {
    if (dataFiltrada.length === 0) return;

    const headers = [
      "ID Orden","Productos","Fecha creación","Fecha actualización",
      "Total","Colonia","Usuario","Método de pago","Estado",
    ];

    const rows = dataFiltrada.map((o) => [
      o.id_orden,
      o.productos,
      formatoFecha(o.fecha_creacion),
      o.fecha_actualizacion ? formatoFecha(o.fecha_actualizacion) : "",
      o.total.toString(),
      o.colonia,
      o.usuario,
      o.metodo_pago,
      o.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((f) => `"${String(f ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historico_ordenes_finalizadas.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-6">
      <header>
        <Title
          title="Histórico de Órdenes Finalizadas"
          subtitle="Órdenes finalizadas con más de 1 día de antigüedad, agrupadas por mes"
          showBackButton
          icon={<LucideDatabaseBackup className="h-6 w-6" />}
          backHref="/ordenes"
        />
      </header>

      {/* Toolbar */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por ID, colonia o usuario…"
              className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {monthLabelEs(m)}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-xl border border-neutral-300 p-1">
              <button
                type="button"
                onClick={() => {
                  setFiltroEstado("todas");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg ${
                  filtroEstado === "todas"
                    ? "bg-neutral-900 text-white"
                    : "hover:bg-neutral-100"
                }`}
              >
                Todas
              </button>

              <button
                type="button"
                onClick={() => {
                  setFiltroEstado("rechazadas");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg ${
                  filtroEstado === "rechazadas"
                    ? "bg-neutral-900 text-white"
                    : "hover:bg-neutral-100"
                }`}
              >
                Rechazadas
              </button>

              <button
                type="button"
                onClick={() => {
                  setFiltroEstado("completadas");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg ${
                  filtroEstado === "completadas"
                    ? "bg-neutral-900 text-white"
                    : "hover:bg-neutral-100"
                }`}
              >
                Completadas
              </button>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
              disabled={dataFiltrada.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>
      </section>

      {/* SPINNER CENTRADO */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="inline-block h-5 w-5 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
            Cargando órdenes…
          </div>
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-red-600">Error: {error}</p>
      )}

      {!loading && (
        <section>
          <Table
            data={paginatedData}
            columns={columnas}
            getRowId={getRowId}
            emptyText="No hay órdenes finalizadas en el criterio seleccionado."
            ariaLabel="Tabla histórico órdenes finalizadas"
            className="bg-white"
          />
        </section>
      )}

      {!loading && dataFiltrada.length > 0 && (
        <div className="mt-2 flex justify-center">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
