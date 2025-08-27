"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Boxes,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Info,
  History,
} from "lucide-react";
import { Title } from "@/components";

/** Ruta a la plantilla CSV dentro de /public */
const TEMPLATE_PATH = "/plantillas/plantilla_carga_productos.csv";

/** Columnas esperadas en el CSV (insensible a may/min) — SIN imágenes */
const REQUIRED_HEADERS = [
  "sku",
  "title",
  "price",
  "brand",
  "category",
  "inStock",
  "isActive",
] as const;

/** Columnas opcionales que ignoramos si vienen (p.ej. images) */
const OPTIONAL_HEADERS = ["images"] as const;

type Row = Record<(typeof REQUIRED_HEADERS)[number], string>;
type ParsedRow = { data: Row; valid: boolean; errors: string[] };
type LoadHistoryItem = {
  id: string;
  fileName: string;
  dateISO: string;
  user: string;
  ok: number;
  warn: number;
  total: number;
};

export default function ImportarProductosPage() {
  /** Tabs */
  const [activeTab, setActiveTab] = useState<"carga" | "historial">("carga");

  /** Estado carga/preview */
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [loadingParse, setLoadingParse] = useState(false);
  const [justLoaded, setJustLoaded] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /** Historial */
  const [history, setHistory] = useState<LoadHistoryItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => {
    if (!rows) return { ok: 0, warn: 0, total: 0 };
    const ok = rows.filter((r) => r.valid).length;
    const warn = rows.length - ok;
    return { ok, warn, total: rows.length };
  }, [rows]);

  /** Dropzone handlers */
  const handleBrowse = () => inputRef.current?.click();
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setJustLoaded({ type: "error", msg: "El archivo debe ser un CSV (.csv)." });
      return;
    }
    setFile(f);
    parseCsvFile(f);
  };

  const parseCsvFile = useCallback(async (f: File) => {
    setLoadingParse(true);
    setJustLoaded(null);
    try {
      const text = await f.text();
      const parsed = parseCSV(text);
      const validated = validateRows(parsed);
      setRows(validated);
      setJustLoaded({ type: "success", msg: "Archivo cargado correctamente. Revisa la previsualización." });
    } catch (err) {
      console.error(err);
      setRows(null);
      setJustLoaded({ type: "error", msg: "No se pudo leer el CSV. Verifica el formato." });
    } finally {
      setLoadingParse(false);
    }
  }, []);

  const handleClear = () => {
    setFile(null);
    setRows(null);
    setJustLoaded(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!rows || rows.length === 0) {
      setJustLoaded({ type: "error", msg: "No hay datos para cargar." });
      return;
    }
    // TODO: reemplazar por POST real a tu backend
    const ok = rows.filter((r) => r.valid).length;
    const warn = rows.length - ok;

    setHistory((prev) => [
      {
        id: crypto.randomUUID(),
        fileName: file?.name || "sin_nombre.csv",
        dateISO: new Date().toISOString(),
        user: "Tú",
        ok, warn, total: rows.length,
      },
      ...prev,
    ]);

    setJustLoaded({
      type: "success",
      msg: `Carga simulada: ${ok} filas correctas, ${warn} con advertencias (total ${rows.length}).`,
    });

    // Si deseas limpiar tras cargar y/o cambiar de tab:
    // handleClear();
    // setActiveTab("historial");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Title
        title="Carga Masiva de Productos"
        subtitle="Importa tu excel (CSV) con productos"
        showBackButton
        backHref="/productos"
        icon={<FileSpreadsheet className="h-6 w-6 text-neutral-700" />}
      />

      {/* Alertas */}
      {justLoaded && (
        <div
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
            justLoaded.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {justLoaded.msg}
        </div>
      )}

      {/* Tabs header */}
      <div className="mt-6">
        <div className="inline-flex rounded-xl bg-neutral-900/5 p-1">
          <button
            onClick={() => setActiveTab("carga")}
            className={`px-4 py-2 text-sm rounded-lg transition
              ${activeTab === "carga"
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-900/10"}`}
            aria-pressed={activeTab === "carga"}
          >
            Carga de Productos
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`px-4 py-2 text-sm rounded-lg transition
              ${activeTab === "historial"
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-900/10"}`}
            aria-pressed={activeTab === "historial"}
          >
            Histórico de Carga
          </button>
        </div>
      </div>

      {/* Panels */}
      <div className="mt-6">
        {/* Carga */}
        {activeTab === "carga" && (
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <header className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-neutral-700" />
                <h2 className="text-base font-semibold">Carga de Productos</h2>
              </div>
              <a
                href={TEMPLATE_PATH}
                download
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
              >
                <Download className="h-4 w-4" />
                Descargar plantilla
              </a>
            </header>

            <div className="p-5">
              {/* Dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  dragOver ? "border-neutral-900 bg-neutral-50" : "border-neutral-300"
                }`}
              >
                <UploadCloud className="mx-auto h-8 w-8 text-neutral-500" />
                <p className="mt-3 text-sm text-neutral-700">Arrastra y suelta tu archivo CSV aquí</p>
                <p className="text-xs text-neutral-500">o</p>
                <div className="mt-3">
                  <button
                    onClick={handleBrowse}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Seleccionar archivo
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={onInputChange}
                  />
                </div>
                {file && (
                  <p className="mt-3 text-xs text-neutral-600">
                    Archivo seleccionado: <span className="font-medium">{file.name}</span>
                    {loadingParse ? " — leyendo..." : ""}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!rows || loadingParse}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Cargar
                </button>

                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar carga
                </button>

                {rows && (
                  <div className="ml-auto flex items-center gap-2 text-xs text-neutral-600">
                    <Info className="h-4 w-4" />
                    <span>
                      {totals.ok} correctas • {totals.warn} con advertencias • {totals.total} total
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Previsualización */}
            <div className="border-t px-5 py-4">
              <h3 className="text-sm font-semibold text-neutral-800">Previsualización</h3>

              {!rows || rows.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-10 text-center">
                  <Search className="mx-auto h-8 w-8 text-neutral-400" />
                  <p className="mt-2 text-sm text-neutral-600">Aún no has realizado una carga.</p>
                  <p className="text-xs text-neutral-500">
                    Descarga la plantilla, completa tus productos y súbela en formato CSV.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-600 border-b">
                        {REQUIRED_HEADERS.map((h) => (
                          <th key={h} className="px-3 py-2 whitespace-nowrap capitalize">
                            {h}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={idx} className="border-b last:border-none">
                          {REQUIRED_HEADERS.map((h) => (
                            <td key={h} className="px-3 py-2 whitespace-nowrap align-top">
                              {r.data[h]}
                            </td>
                          ))}
                          <td className="px-3 py-2 whitespace-nowrap align-top text-right">
                            {r.valid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                                <CheckCircle2 className="h-4 w-4" />
                                Correcto
                              </span>
                            ) : (
                              <span className="group relative inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                                <AlertTriangle className="h-4 w-4" />
                                Advertencia
                                <span className="pointer-events-none absolute left-0 top-[120%] z-10 hidden min-w-[16rem] rounded-lg border border-neutral-200 bg-white p-2 text-xs text-neutral-700 shadow-lg group-hover:block">
                                  {r.errors.map((e, i) => (
                                    <div key={i}>• {e}</div>
                                  ))}
                                </span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Historial */}
        {activeTab === "historial" && (
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <header className="flex items-center gap-2 px-5 py-4 border-b">
              <History className="h-5 w-5 text-neutral-700" />
              <h2 className="text-base font-semibold">Histórico de Carga</h2>
            </header>

            {history.length === 0 ? (
              <div className="p-6 text-sm text-neutral-600">
                Aún no hay cargas registradas.
                <p className="mt-1 text-xs text-neutral-500">
                  Cuando cargues un archivo desde la pestaña “Carga de Productos”, verás aquí el resumen con fecha y resultados.
                </p>
              </div>
            ) : (
              <div className="p-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-600 border-b">
                      <th className="px-3 py-2">Fecha de carga</th>
                      <th className="px-3 py-2">Archivo</th>
                      <th className="px-3 py-2">Quién cargó</th>
                      <th className="px-3 py-2">Resumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-b last:border-none">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(h.dateISO).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{h.fileName}</td>
                        <td className="px-3 py-2">{h.user}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2">
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800">OK: {h.ok}</span>
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800">Advert.: {h.warn}</span>
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-neutral-800">Total: {h.total}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Utils CSV ------------------------------- */

function parseCSV(text: string) {
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\uFEFF/, "");
  const lines = clean.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [] as Row[];

  const header = lines[0].split(",").map((h) => h.trim());
  const indexMap: Record<string, number> = {};
  REQUIRED_HEADERS.forEach((key) => {
    indexMap[key] = header.findIndex((h) => normalizeHeader(h) === key);
  });
  // ignoramos opcionales si vienen
  OPTIONAL_HEADERS.forEach((key) => {
    const _idx = header.findIndex((h) => normalizeHeader(h) === key);
    // no hacemos nada con ese índice: simplemente no lo usamos
  });

  const out: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i]);
    const row: any = {};
    REQUIRED_HEADERS.forEach((key) => {
      const idx = indexMap[key];
      row[key] = idx >= 0 && parts[idx] != null ? String(parts[idx]).trim() : "";
    });
    out.push(row as Row);
  }
  return out;
}

function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function validateRows(rows: Row[]): ParsedRow[] {
  return rows.map((r) => {
    const errors: string[] = [];

    if (!r.sku) errors.push("SKU es requerido.");
    if (!r.title) errors.push("Título es requerido.");

    if (!r.price) errors.push("Precio es requerido.");
    else if (isNaN(Number(r.price)) || Number(r.price) < 0)
      errors.push("Precio debe ser un número >= 0.");

    if (r.inStock === "") errors.push("Stock es requerido.");
    else if (!/^\d+$/.test(r.inStock) || Number(r.inStock) < 0)
      errors.push("Stock debe ser un entero >= 0.");

    const activeStr = r.isActive.toLowerCase();
    if (!["true", "false", "1", "0", "sí", "si", "no"].includes(activeStr))
      errors.push('isActive debe ser "true/false", "1/0" o "sí/no".');

    if (!r.brand) errors.push("Marca es recomendada.");
    if (!r.category) errors.push("Categoría es recomendada.");

    return { data: r, valid: errors.length === 0, errors };
  });
}
