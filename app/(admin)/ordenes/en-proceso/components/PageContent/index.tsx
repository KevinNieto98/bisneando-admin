"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Modal, Table, Title, Column } from "@/components";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import {
  Search as SearchIcon,
  ShoppingCart,
  XCircle,
  Download,
  Truck,
} from "lucide-react";
import {
  getOrdersHeadAction,
  OrderHead,
  rejectOrderAction,
} from "../../../actions";
import { useUIStore } from "@/store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FooterModal } from "../FooterModal"; // ajusta ruta si es necesario

type StatusUI = "nueva" | "proceso" | "finalizada";
type FiltroEstado = "todas" | "rechazadas" | "completadas";

type Orden = {
  id_orden: string;
  uid: string;
  uid_delivery: string | null;
  nombre_delivery: string | null;
  productos: number;
  fecha_creacion: string; // ISO
  fecha_actualizacion?: string | null;
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
// 2,3,4,8  → proceso
// 5,6      → finalizada
const mapStatus = (id_status: number): StatusUI => {
  if (id_status === 1) return "nueva";
  if ((id_status >= 2 && id_status <= 4) || id_status === 8) return "proceso";
  if (id_status === 5 || id_status === 6) return "finalizada";
  return "finalizada";
};

// Mapper desde la API
const mapOrderHeadToOrden = (o: OrderHead): Orden => {
  const id_status = o.id_status ?? 1;
  return {
    id_orden: String(o.id_order),
    uid: o.uid,
    uid_delivery: o.uid_delivery ?? null,
    nombre_delivery: o.nombre_delivery ?? null,
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

// Comparador por fecha creación (para nuevas/proceso)
const sortByOldest = (a: Orden, b: Orden) => {
  const ta = new Date(a.fecha_creacion).getTime();
  const tb = new Date(b.fecha_creacion).getTime();
  return ta - tb;
};

// ¿Es hoy? usando fecha local
const isTodayLocal = (iso?: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

// Comparador por fecha_actualizacion (fallback a fecha_creacion)
// 👉 más reciente primero
const sortByUpdatedNewest = (a: Orden, b: Orden) => {
  const ta = new Date(a.fecha_actualizacion ?? a.fecha_creacion).getTime();
  const tb = new Date(b.fecha_actualizacion ?? b.fecha_creacion).getTime();
  return tb - ta; // más nueva arriba
};

const esRechazada = (o: Orden) => o.id_status === 6;
const esCompletada = (o: Orden) => o.id_status === 5;

export function PageContent() {
  const searchParams = useSearchParams();
  const estadoParam = searchParams.get("estado");

  const [tab, setTab] = useState<
    "nuevas" | "proceso" | "sin-delivery" | "motorista" | "finalizadas" | "problemas"
  >("proceso");
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [queryNuevas, setQueryNuevas] = useState("");
  const [queryProceso, setQueryProceso] = useState("");
  const [querySinDelivery, setQuerySinDelivery] = useState("");
  const [queryMotorista, setQueryMotorista] = useState("");
  const [filtroDelivery, setFiltroDelivery] = useState<string>("todos");
  const [queryFinal, setQueryFinal] = useState("");
  const [queryProblemas, setQueryProblemas] = useState("");
  const [filtroEstadoFinal, setFiltroEstadoFinal] =
    useState<FiltroEstado>("todas");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⏱️ Para evitar problemas de hidratación
  const [now, setNow] = useState<number | null>(null);

  // Modal de rechazo
  const [openReject, setOpenReject] = useState(false);
  const [rejectingOrder, setRejectingOrder] = useState<Orden | null>(null);
  const [observacion, setObservacion] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);
  const rejectFormId = "rechazar-orden-form";

  // UI store
  const openConfirm = useUIStore((s) => s.openConfirm);
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);

  // cambiar tab desde URL
  useEffect(() => {
    if (estadoParam === "nueva") setTab("nuevas");
    else if (estadoParam === "finalizada") setTab("finalizadas");
    else if (estadoParam === "proceso") setTab("proceso");
    else if (estadoParam === "sin-delivery") setTab("sin-delivery");
    else if (estadoParam === "motorista") setTab("motorista");
    else if (estadoParam === "problemas") setTab("problemas");
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
        mostrarAlerta("Error", "No se pudieron cargar las órdenes.", "danger");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [mostrarAlerta]);

  // ⏱️ Timer solo en cliente (sin SSR): actualiza cada 1 minuto
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(id);
  }, []);

  // Abrir modal de rechazo
  const handleOpenRejectModal = (orden: Orden) => {
    if (submittingReject) return;
    setRejectingOrder(orden);
    setObservacion("");
    setOpenReject(true);
  };

  // Cerrar modal de rechazo
  const handleCloseRejectModal = () => {
    if (submittingReject) return;
    setOpenReject(false);
    setRejectingOrder(null);
    setObservacion("");
  };

  // Submit del formulario del modal (aquí se lanza el ConfirmDialog)
  const handleSubmitReject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rejectingOrder) return;

    openConfirm({
      titulo: "Confirmar rechazo",
      mensaje: `¿Confirmas que deseas rechazar la orden #${rejectingOrder.id_orden}?`,
      confirmText: "Rechazar",
      rejectText: "Cancelar",
      onConfirm: async () => {
        const nowIso = new Date().toISOString(); // misma hora para UI
        setSubmittingReject(true);
        try {
          await rejectOrderAction({
            id_order: Number(rejectingOrder.id_orden),
            observacion,
          });

          // Actualizar estado en memoria para que se mueva a "finalizadas"
          setOrdenes((prev) =>
            prev.map((o) =>
              o.id_orden === rejectingOrder.id_orden
                ? {
                    ...o,
                    id_status: 6,
                    uiStatus: "finalizada",
                    status: "Rechazada",
                    fecha_actualizacion: nowIso, // 👈 clave para filtro + orden
                  }
                : o
            )
          );

          mostrarAlerta(
            "Orden rechazada",
            `La orden #${rejectingOrder.id_orden} se rechazó correctamente.`,
            "success"
          );

          handleCloseRejectModal();
        } catch (err) {
          console.error("Error al rechazar la orden:", err);
          mostrarAlerta(
            "Error",
            "No se pudo rechazar la orden. Intenta de nuevo.",
            "danger"
          );
        } finally {
          setSubmittingReject(false);
        }
      },
    });
  };

  // Columnas base (sin Acciones, sin fecha actualización)
  const columnasBase: Column<Orden>[] = useMemo(
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
          <span className="whitespace-nowrap">
            {formatoFecha(r.fecha_creacion)}
          </span>
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
        cell: (r) => (
          <span className="font-medium">{formatoMoneda(r.total)}</span>
        ),
      },

      // ⏱️ Tiempo en bandeja
      {
        header: "Tiempo en bandeja",
        align: "center",
        cell: (r) => {
          if (!now) return "--";
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
    ],
    [now]
  );

  // Columnas con Acciones (para nuevas y proceso y problemas)
  const columnasConAcciones: Column<Orden>[] = useMemo(
    () => [
      ...columnasBase,
      {
        header: "Acciones",
        align: "center",
        cell: (r) => (
          <button
            onClick={() => handleOpenRejectModal(r)}
            className="inline-flex items-center justify-center rounded-full p-2 
                       border border-red-300/60 bg-red-50 
                       hover:bg-red-100 hover:border-red-400 
                       transition-colors disabled:opacity-60"
            title="Rechazar orden"
            disabled={submittingReject}
          >
            <XCircle className="h-5 w-5 text-red-600" />
          </button>
        ),
      },
    ],
    [columnasBase, submittingReject]
  );

  // Columnas SOLO para finalizadas: base + Fecha actualización (sin Acciones)
  const columnasFinalizadas: Column<Orden>[] = useMemo(() => {
    const base = [...columnasBase];
    // Insertar después de "Fecha creación"
    base.splice(3, 0, {
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
    });
    return base;
  }, [columnasBase]);

  const getRowId = (r: Orden) => r.id_orden;

  // filtros texto
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

  const filtraEstadoFinal = (o: Orden) => {
    if (filtroEstadoFinal === "todas") return true;
    if (filtroEstadoFinal === "rechazadas") return esRechazada(o);
    if (filtroEstadoFinal === "completadas") return esCompletada(o);
    return true;
  };

  // 🔽 Nuevas y Proceso: por fecha_creacion (más viejas primero)
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
        .filter((o) => o.uiStatus === "proceso" && o.id_status !== 4 && coincide(o, queryProceso))
        .slice()
        .sort(sortByOldest),
    [ordenes, queryProceso]
  );

  const dataSinDelivery = useMemo(
    () =>
      ordenes
        .filter((o) => o.id_status === 4 && coincide(o, querySinDelivery))
        .slice()
        .sort(sortByOldest),
    [ordenes, querySinDelivery]
  );

  // Lista única de deliveries para el filtro (derivada de las órdenes con status 8)
  const deliveriesEnTabla = useMemo(() => {
    const seen = new Set<string>();
    const list: { uid: string; nombre: string }[] = [];
    ordenes
      .filter((o) => o.id_status === 8 && o.uid_delivery)
      .forEach((o) => {
        if (!seen.has(o.uid_delivery!)) {
          seen.add(o.uid_delivery!);
          list.push({ uid: o.uid_delivery!, nombre: o.nombre_delivery ?? o.uid_delivery! });
        }
      });
    return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ordenes]);

  // 🔽 Con Motorista Asignado: id_status = 8
  const dataMotorista = useMemo(
    () =>
      ordenes
        .filter((o) => {
          if (o.id_status !== 8) return false;
          if (filtroDelivery !== "todos" && o.uid_delivery !== filtroDelivery) return false;
          return coincide(o, queryMotorista);
        })
        .slice()
        .sort(sortByOldest),
    [ordenes, queryMotorista, filtroDelivery]
  );

  // 🔽 Problemas: id_status = 7, mismas funcionalidades que Nuevas/Proceso
  const dataProblemas = useMemo(
    () =>
      ordenes
        .filter((o) => o.id_status === 7 && coincide(o, queryProblemas))
        .slice()
        .sort(sortByOldest),
    [ordenes, queryProblemas]
  );

  // 🔽 Finalizadas: solo de hoy, más recientes primero (por fecha_actualizacion) + filtro estado
  const dataFinal = useMemo(
    () =>
      ordenes
        .filter(
          (o) =>
            o.uiStatus === "finalizada" &&
            isTodayLocal(o.fecha_actualizacion ?? o.fecha_creacion) &&
            coincide(o, queryFinal) &&
            filtraEstadoFinal(o)
        )
        .slice()
        .sort(sortByUpdatedNewest), // 👈 más nueva arriba
    [ordenes, queryFinal, filtroEstadoFinal]
  );

  // Helper general para exportar
  const exportOrdersToCsv = (filename: string, data: Orden[]) => {
    if (!data.length) return;

    const headers = [
      "ID Orden",
      "Productos",
      "Fecha creación",
      "Fecha actualización",
      "Total",
      "Colonia",
      "Usuario",
      "Método de pago",
      "Estado",
    ];

    const rows = data.map((o) => [
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

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((field) => {
            const f = String(field ?? "");
            const escaped = f.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(";")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportNuevas = () =>
    exportOrdersToCsv("ordenes_nuevas.csv", dataNuevas);

  const handleExportProceso = () =>
    exportOrdersToCsv("ordenes_en_proceso.csv", dataProceso);

  const handleExportSinDelivery = () =>
    exportOrdersToCsv("ordenes_sin_delivery.csv", dataSinDelivery);

  const handleExportMotorista = () =>
    exportOrdersToCsv("ordenes_con_motorista.csv", dataMotorista);

  const handleExportProblemas = () =>
    exportOrdersToCsv("ordenes_con_problemas.csv", dataProblemas);

  const handleExportFinalizadas = () =>
    exportOrdersToCsv("ordenes_finalizadas_hoy.csv", dataFinal);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-6">
      {/* Alert global */}
      <Alert />

      <header className="flex items-end justify-between w-full gap-4">
        <Title
          title="Órdenes en Proceso"
          subtitle="Menú de órdenes"
          icon={<ShoppingCart className="h-6 w-6 text-neutral-700" />}
          showBackButton
          backHref="/ordenes"
        />
      </header>

      {loading && <p className="text-sm text-neutral-500">Cargando órdenes…</p>}
      {error && !loading && (
        <p className="text-sm text-red-600">Error: {error}</p>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) =>
          setTab(v as "nuevas" | "proceso" | "sin-delivery" | "motorista" | "finalizadas" | "problemas")
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="nuevas">Órdenes Nuevas</TabsTrigger>
          <TabsTrigger value="proceso">Órdenes en Proceso</TabsTrigger>
          <TabsTrigger value="sin-delivery">Sin Delivery</TabsTrigger>
          <TabsTrigger value="motorista">
            <Truck className="w-3.5 h-3.5 mr-1 shrink-0" />
            Con Motorista
          </TabsTrigger>
          <TabsTrigger value="finalizadas">Órdenes Finalizadas</TabsTrigger>
          <TabsTrigger value="problemas">Con Problemas</TabsTrigger>
        </TabsList>

        {/* NUEVAS */}
        <TabsContent value="nuevas">
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  value={queryNuevas}
                  onChange={(e) => setQueryNuevas(e.target.value)}
                  placeholder="Buscar por ID, colonia o usuario…"
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              <button
                type="button"
                onClick={handleExportNuevas}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
                disabled={dataNuevas.length === 0}
                title="Exportar órdenes nuevas"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>

            <Table
              data={dataNuevas}
              columns={columnasConAcciones}
              getRowId={getRowId}
              emptyText="No hay órdenes nuevas"
              ariaLabel="Tabla de órdenes nuevas"
            />
          </div>
        </TabsContent>

        {/* PROCESO */}
        <TabsContent value="proceso">
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  value={queryProceso}
                  onChange={(e) => setQueryProceso(e.target.value)}
                  placeholder="Buscar por ID, colonia o usuario…"
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              <button
                type="button"
                onClick={handleExportProceso}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
                disabled={dataProceso.length === 0}
                title="Exportar órdenes en proceso"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>

            <Table
              data={dataProceso}
              columns={columnasConAcciones}
              getRowId={getRowId}
              emptyText="No hay órdenes en proceso"
              ariaLabel="Tabla de órdenes en proceso"
            />
          </div>
        </TabsContent>

        {/* SIN DELIVERY (id_status = 4) */}
        <TabsContent value="sin-delivery">
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  value={querySinDelivery}
                  onChange={(e) => setQuerySinDelivery(e.target.value)}
                  placeholder="Buscar por ID, colonia o usuario…"
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              <button
                type="button"
                onClick={handleExportSinDelivery}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
                disabled={dataSinDelivery.length === 0}
                title="Exportar órdenes sin delivery asignado"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>

            <Table
              data={dataSinDelivery}
              columns={columnasConAcciones}
              getRowId={getRowId}
              emptyText="No hay órdenes sin delivery asignado"
              ariaLabel="Tabla de órdenes sin delivery"
            />
          </div>
        </TabsContent>

        {/* PROBLEMAS (id_status = 7, mismas funcionalidades que Nuevas/Proceso) */}
        <TabsContent value="problemas">
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  value={queryProblemas}
                  onChange={(e) => setQueryProblemas(e.target.value)}
                  placeholder="Buscar por ID, colonia o usuario…"
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              <button
                type="button"
                onClick={handleExportProblemas}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
                disabled={dataProblemas.length === 0}
                title="Exportar órdenes con problemas"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>

            <Table
              data={dataProblemas}
              columns={columnasConAcciones}
              getRowId={getRowId}
              emptyText="No hay órdenes con problemas"
              ariaLabel="Tabla de órdenes con problemas"
            />
          </div>
        </TabsContent>

        {/* CON MOTORISTA ASIGNADO (id_status = 8) */}
        <TabsContent value="motorista">
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Buscador */}
              <div className="relative w-full md:max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  value={queryMotorista}
                  onChange={(e) => setQueryMotorista(e.target.value)}
                  placeholder="Buscar por ID, colonia o usuario…"
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              {/* Filtro por motorista */}
              <select
                value={filtroDelivery}
                onChange={(e) => setFiltroDelivery(e.target.value)}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 md:max-w-xs w-full"
              >
                <option value="todos">Todos los motoristas</option>
                {deliveriesEnTabla.map((d) => (
                  <option key={d.uid} value={d.uid}>{d.nombre}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportMotorista}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
                disabled={dataMotorista.length === 0}
                title="Exportar órdenes con motorista asignado"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>

            <Table
              data={dataMotorista}
              columns={[
                ...columnasBase,
                {
                  header: "Motorista",
                  align: "left",
                  cell: (r) => (
                    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-800">
                      <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {r.nombre_delivery ?? "—"}
                    </span>
                  ),
                },
              ]}
              getRowId={getRowId}
              emptyText="No hay órdenes con motorista asignado"
              ariaLabel="Tabla de órdenes con motorista"
            />
          </div>
        </TabsContent>

        {/* FINALIZADAS (solo hoy, más recientes primero, sin Acciones, con Fecha actualización) */}
        <TabsContent value="finalizadas">
          <div className="mt-4 space-y-4">
            {/* Toolbar Finalizadas */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Buscador */}
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  value={queryFinal}
                  onChange={(e) => setQueryFinal(e.target.value)}
                  placeholder="Buscar por ID, colonia o usuario…"
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              {/* Filtros / Export */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro estado finalizadas */}
                <div className="inline-flex rounded-xl border border-neutral-300 p-1">
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoFinal("todas")}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg ${
                      filtroEstadoFinal === "todas"
                        ? "bg-neutral-900 text-white"
                        : "hover:bg-neutral-100"
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoFinal("rechazadas")}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg ${
                      filtroEstadoFinal === "rechazadas"
                        ? "bg-neutral-900 text-white"
                        : "hover:bg-neutral-100"
                    }`}
                  >
                    Rechazadas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoFinal("completadas")}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg ${
                      filtroEstadoFinal === "completadas"
                        ? "bg-neutral-900 text-white"
                        : "hover:bg-neutral-100"
                    }`}
                  >
                    Completadas
                  </button>
                </div>

                {/* Exportar */}
                <button
                  type="button"
                  onClick={handleExportFinalizadas}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
                  disabled={dataFinal.length === 0}
                  title="Exportar órdenes finalizadas de hoy (vista actual)"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
              </div>
            </div>

            {/* Tabla Finalizadas */}
            <div>
              <Table
                data={dataFinal}
                columns={columnasFinalizadas}
                getRowId={getRowId}
                emptyText="No hay órdenes finalizadas hoy"
                ariaLabel="Tabla de órdenes finalizadas"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de rechazo */}
      <Modal
        open={openReject}
        size="xl"
        onClose={handleCloseRejectModal}
        title={
          rejectingOrder
            ? `Rechazar orden #${rejectingOrder.id_orden}`
            : "Rechazar orden"
        }
        icon={<XCircle className="w-5 h-5 text-red-600" />}
        content={
          <form
            id={rejectFormId}
            onSubmit={handleSubmitReject}
            className={
              submittingReject
                ? "space-y-4 pointer-events-none opacity-60"
                : "space-y-4"
            }
          >
            {submittingReject ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                <span className="text-sm text-neutral-600">
                  Rechazando orden...
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <label
                  htmlFor="observacion"
                  className="text-sm font-medium text-neutral-800"
                >
                  Observación
                </label>
                <textarea
                  id="observacion"
                  name="observacion"
                  rows={4}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  placeholder="Escribe el motivo del rechazo..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  required
                />
              </div>
            )}
          </form>
        }
        footer={
          <FooterModal
            formId={rejectFormId}
            onCancel={handleCloseRejectModal}
            disabled={submittingReject}
            cancelText="Cerrar"
            saveText="Guardar"
          />
        }
      />

      {/* Confirm global */}
      <ConfirmDialog />
    </div>
  );
}
