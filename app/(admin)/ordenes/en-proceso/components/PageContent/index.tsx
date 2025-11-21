"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Title } from "@/components";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { Table, Column } from "@/components";
import { Search as SearchIcon, ShoppingCart, XCircle } from "lucide-react";
import { getOrdersHeadAction, OrderHead } from "../../../actions";

type StatusUI = "nueva" | "proceso" | "finalizada";

type Orden = {
  id_orden: string;
  uid: string;
  productos: number;
  fecha_creacion: string; // ISO
  total: number;
  colonia: string;
  id_status: number;
  status: string;
  usuario: string;
  metodo_pago: string;
  uiStatus: StatusUI;
};

// Formato Lempiras (HNL)
const formatoMoneda = (n: number) =>
  new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
  }).format(n);

const formatoFecha = (iso: string) => new Date(iso).toLocaleString();

// 🔥 Lógica de estados:
// 1        → nueva
// 2,3,4    → proceso
// 5,6      → finalizada
const mapStatus = (id_status: number): StatusUI => {
  if (id_status === 1) return "nueva";
  if (id_status >= 2 && id_status <= 4) return "proceso";
  if (id_status === 5 || id_status === 6) return "finalizada";
  return "finalizada";
};

// Mapper desde la API
const mapOrderHeadToOrden = (o: OrderHead): Orden => {
  const id_status = o.id_status ?? 1;
  return {
    id_orden: String(o.id_order),
    uid: o.uid,
    productos: o.qty,
    fecha_creacion: o.fecha_creacion ?? new Date().toISOString(),
    total: o.total,
    colonia: o.nombre_colonia ?? "Sin colonia",
    usuario: o.usuario ?? "sin-usuario",
    metodo_pago: o.metodo_pago ?? "Sin método",
    status: o.status ?? "Sin estado",
    id_status,
    uiStatus: mapStatus(id_status),
  };
};

// Badge de status
const getStatusClasses = (s: StatusUI) => {
  if (s === "nueva") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (s === "proceso") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  return "bg-neutral-100 text-neutral-700 border border-neutral-200";
};

// Formatear duración (ms → texto amigable)
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

// Comparador para ordenar de más vieja a más nueva
const sortByOldest = (a: Orden, b: Orden) => {
  const ta = new Date(a.fecha_creacion).getTime();
  const tb = new Date(b.fecha_creacion).getTime();
  return ta - tb;
};

export function PageContent() {
  const searchParams = useSearchParams();
  const estadoParam = searchParams.get("estado");

  const [tab, setTab] = useState<"nuevas" | "proceso" | "finalizadas">("proceso");
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [queryNuevas, setQueryNuevas] = useState("");
  const [queryProceso, setQueryProceso] = useState("");
  const [queryFinal, setQueryFinal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ Para evitar problemas de hidratación, iniciamos now como null
  const [now, setNow] = useState<number | null>(null);

  // cambiar tab desde URL
  useEffect(() => {
    if (estadoParam === "nueva") setTab("nuevas");
    else if (estadoParam === "finalizada") setTab("finalizadas");
    else if (estadoParam === "proceso") setTab("proceso");
  }, [estadoParam]);

  // cargar órdenes
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows = await getOrdersHeadAction();
        setOrdenes(rows.map(mapOrderHeadToOrden));
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar órdenes");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ⏱️ Timer solo en cliente (sin SSR): actualiza cada 1 minuto
  useEffect(() => {
    setNow(Date.now()); // se setea tras el mount (cliente)
    const id = setInterval(() => {
      setNow(Date.now());
    }, 60000); // cada minuto

    return () => clearInterval(id);
  }, []);

  // columnas tabla
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
        cell: (r) => (
          <span className="whitespace-nowrap">{formatoFecha(r.fecha_creacion)}</span>
        ),
      },
      { header: "Colonia", align: "left", cell: (r) => r.colonia },

      // Usuario como link
      {
        header: "Usuario",
        align: "left",
        cell: (r) => (
          <Link
            href={`/usuarios/${r.uid}`}
            className="text-blue-700 underline underline-offset-2 hover:opacity-80"
          >
            {r.usuario}
          </Link>
        ),
      },

      // Método de pago
      {
        header: "Método de pago",
        align: "left",
        cell: (r) => (
          <span className="text-neutral-800 text-sm font-medium">
            {r.metodo_pago}
          </span>
        ),
      },

      {
        header: "Total",
        align: "right",
        cell: (r) => <span className="font-medium">{formatoMoneda(r.total)}</span>,
      },

      // ⏱️ Tiempo en bandeja
      {
        header: "Tiempo en bandeja",
        align: "center",
        cell: (r) => {
          if (!now) return "--"; // durante la hidratación inicial
          const createdAt = new Date(r.fecha_creacion).getTime();
          const diff = now - createdAt;
          return (
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
              {formatDuration(diff)}
            </span>
          );
        },
      },

      // Badge de status
      {
        header: "Status",
        align: "center",
        cell: (r) => (
          <span
            className={
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium " +
              getStatusClasses(r.uiStatus)
            }
          >
            {r.status}
          </span>
        ),
      },

      // Botón rechazar
      {
        header: "Acciones",
        align: "center",
        cell: (r) => (
          <button
            onClick={() => console.log("rechazada", r.id_orden)}
            className="inline-flex items-center justify-center rounded-full p-2 
                       border border-red-300/60 bg-red-50 
                       hover:bg-red-100 hover:border-red-400 
                       transition-colors"
            title="Rechazar orden"
          >
            <XCircle className="h-5 w-5 text-red-600" />
          </button>
        ),
      },
    ],
    [now]
  );

  const getRowId = (r: Orden) => r.id_orden;

  // filtros
  const normaliza = (s: string) => s.toLowerCase();
  const coincide = (o: Orden, q: string) => {
    if (!q) return true;
    const t = normaliza(q);
    return (
      o.id_orden.toLowerCase().includes(t) ||
      o.colonia.toLowerCase().includes(t) ||
      o.usuario.toLowerCase().includes(t)
    );
  };

  // 🔽 Ordenamos de la más vieja a la más nueva dentro de cada bandeja
  const dataNuevas = useMemo(
    () =>
      ordenes
        .filter((o) => o.uiStatus === "nueva" && coincide(o, queryNuevas))
        .slice()
        .sort(sortByOldest),
    [ordenes, queryNuevas]
  );

  const dataProceso = useMemo(
    () =>
      ordenes
        .filter((o) => o.uiStatus === "proceso" && coincide(o, queryProceso))
        .slice()
        .sort(sortByOldest),
    [ordenes, queryProceso]
  );

  const dataFinal = useMemo(
    () =>
      ordenes
        .filter((o) => o.uiStatus === "finalizada" && coincide(o, queryFinal))
        .slice()
        .sort(sortByOldest),
    [ordenes, queryFinal]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-6">
      <header className="flex items-end justify-between w-full gap-4">
        <Title
          title="Órdenes en Proceso"
          subtitle="Menú de órdenes"
          icon={<ShoppingCart className="h-6 w-6 text-neutral-700" />}
          showBackButton
        />
      </header>

      {loading && <p className="text-sm text-neutral-500">Cargando órdenes…</p>}
      {error && !loading && <p className="text-sm text-red-600">Error: {error}</p>}

      <Tabs
        value={tab}
        onValueChange={(v) =>
          setTab(v as "nuevas" | "proceso" | "finalizadas")
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nuevas">Órdenes Nuevas</TabsTrigger>
          <TabsTrigger value="proceso">Órdenes en Proceso</TabsTrigger>
          <TabsTrigger value="finalizadas">Órdenes Finalizadas</TabsTrigger>
        </TabsList>

        {/* NUEVAS */}
        <TabsContent value="nuevas">
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
