"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus, ListChecks, Search } from "lucide-react";
import { Modal, Switch, Table, Title } from "@/components";

// Si tu módulo "@/components" exporta el tipo Column, usa esta línea:
// import { Table, Title, Modal, Switch, type Column } from "@/components";

// Si NO exportas Column desde "@/components", deja este tipo local:
type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

// Tipos
interface StatusPedido {
  id_status: number;
  nombre_status: string;
  disponible: boolean;
  flujo: number; // paso 1,2,3...
}

// Datos de ejemplo (reemplazar con fetch/DB)
const initialData: StatusPedido[] = [
  { id_status: 1, nombre_status: "Recibido", disponible: true, flujo: 1 },
  { id_status: 2, nombre_status: "En preparación", disponible: true, flujo: 2 },
  { id_status: 3, nombre_status: "Despachado", disponible: true, flujo: 3 },
];

// ---------- Formulario ----------
function StatusForm({
  value,
  onChange,
  onSubmit,
  formId = "status-form",
}: {
  value: StatusPedido;
  onChange: (next: StatusPedido) => void;
  onSubmit: () => void;
  formId?: string;
}) {
  const [touched, setTouched] = useState(false);
  const nombreValido = value.nombre_status.trim().length >= 2;
  const flujoValido = Number.isFinite(value.flujo) && value.flujo >= 1 && value.flujo <= 50;

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!nombreValido || !flujoValido) return;
        onSubmit();
      }}
      className="space-y-4"
    >
      {/* Nombre */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Nombre del status</label>
        <input
          autoFocus
          value={value.nombre_status}
          onChange={(e) => onChange({ ...value, nombre_status: e.target.value })}
          placeholder="Ej. En preparación"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        />
        {touched && !nombreValido && (
          <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>
        )}
      </div>

      {/* Flujo */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Paso en el flujo</label>
        <input
          type="number"
          min={1}
          max={50}
          value={value.flujo}
          onChange={(e) => onChange({ ...value, flujo: Number(e.target.value) || 1 })}
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        />
        {touched && !flujoValido && (
          <p className="text-xs text-red-600">El paso debe estar entre 1 y 50.</p>
        )}
      </div>

      {/* Disponible */}
      <div className="flex items-center gap-3">
        <Switch
          checked={value.disponible}
          onChange={(next) => onChange({ ...value, disponible: next })}
          ariaLabel="Cambiar disponibilidad"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.disponible ? "Disponible" : "No disponible"}
        </span>
      </div>
    </form>
  );
}

// ---------- Página ----------
export default function StatusPedidoPage() {
  const [data, setData] = useState<StatusPedido[]>(initialData);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StatusPedido | null>(null);
  const formId = "status-form";

  // Filtro simple por texto/ID/flujo
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((s) =>
      [
        s.id_status.toString(),
        s.nombre_status.toLowerCase(),
        s.flujo.toString(),
      ].some((v) => v.includes(q))
    );
  }, [data, query]);

  // Handlers
  const handleCreate = () => {
    setEditing({
      id_status: nextId(data),
      nombre_status: "",
      disponible: true,
      flujo: Math.max(1, ...data.map((d) => d.flujo)) + 1, // sugiere siguiente paso
    });
    setOpen(true);
  };

  const handleEdit = (s: StatusPedido) => {
    setEditing({ ...s });
    setOpen(true);
  };

  const handleToggleDisponible = (id: number, next?: boolean) => {
    setData((prev) =>
      prev.map((s) =>
        s.id_status === id
          ? { ...s, disponible: typeof next === "boolean" ? next : !s.disponible }
          : s
      )
    );
  };

  const handleSave = () => {
    if (!editing) return;
    // normaliza flujo a entero 1..50
    const flujo = Math.min(50, Math.max(1, Math.floor(editing.flujo || 1)));
    const toSave = { ...editing, flujo };

    setData((prev) => {
      const exists = prev.some((s) => s.id_status === toSave.id_status);
      const next = exists
        ? prev.map((s) => (s.id_status === toSave.id_status ? toSave : s))
        : [...prev, toSave];
      // opcional: ordenar por flujo para visual
      return next.sort((a, b) => a.flujo - b.flujo || a.id_status - b.id_status);
    });

    setOpen(false);
    setEditing(null);
  };

  // Columnas
  const columns: Column<StatusPedido>[] = [
    {
      header: "ID",
      className: "w-16 text-center",
      align: "center",
      cell: (row) => row.id_status,
    },
    {
      header: "Nombre",
      className: "min-w-[220px] w-full text-left",
      align: "left",
      cell: (row) => (
        <span className="font-medium text-neutral-900">{row.nombre_status}</span>
      ),
    },
    {
      header: "Flujo",
      className: "w-28 text-center",
      align: "center",
      cell: (row) => (
        <span className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold">
          Paso {row.flujo}
        </span>
      ),
    },
    {
      header: "Disponible",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={row.disponible}
            onChange={(next) => handleToggleDisponible(row.id_status, next)}
            ariaLabel={`Cambiar disponibilidad de ${row.nombre_status}`}
          />
          <span className="text-xs font-medium text-neutral-700">
            {row.disponible ? "Sí" : "No"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header */}
      <Title
        showBackButton
        backHref="/mantenimiento"
        title="Status Pedidos"
        subtitle="Define el flujo de estados del pedido."
        icon={<ListChecks className="h-5 w-5" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar status..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Nuevo status
          </button>
        </div>
      </div>

      {/* Tabla */}
      <Table
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id_status}
        actions={(row: StatusPedido) => (
          <button
            onClick={() => handleEdit(row)}
            className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
            aria-label="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        actionsHeader="Acciones"
        ariaLabel="Tabla de status"
      />

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar status" : "Nuevo status"}
        icon={<ListChecks className="w-5 h-5" />}
        content={
          editing && (
            <StatusForm
              value={editing}
              onChange={setEditing}
              onSubmit={handleSave}
              formId={formId}
            />
          )
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form={formId}
              className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Guardar
            </button>
          </div>
        }
      />
    </div>
  );
}

function nextId(arr: StatusPedido[]) {
  return (
    (arr.reduce((max, s) => (s.id_status > max ? s.id_status : max), 0) || 0) + 1
  );
}
