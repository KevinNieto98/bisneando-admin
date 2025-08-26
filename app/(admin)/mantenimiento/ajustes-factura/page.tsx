"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus, Percent, Search } from "lucide-react";
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

type TipoAjuste = "Descuento" | "Impuesto";

// Tipos
interface Ajuste {
  id_ajuste: number;
  nombre_ajuste: string;
  disponible: boolean;
  tipo_ajuste: TipoAjuste;
}

// Datos de ejemplo (reemplazar con fetch/DB)
const initialData: Ajuste[] = [
  { id_ajuste: 1, nombre_ajuste: "Descuento promo", disponible: true,  tipo_ajuste: "Descuento" },
  { id_ajuste: 2, nombre_ajuste: "ISV 15%",        disponible: true,  tipo_ajuste: "Impuesto"  },
  { id_ajuste: 3, nombre_ajuste: "Cupón fidelidad", disponible: false, tipo_ajuste: "Descuento" },
];

/** Formulario de crear/editar (submit lo maneja el footer del modal) */
function AjusteForm({
  value,
  onChange,
  onSubmit,
  formId = "ajuste-form",
}: {
  value: Ajuste;
  onChange: (next: Ajuste) => void;
  onSubmit: () => void;
  formId?: string;
}) {
  const [touched, setTouched] = useState(false);
  const nombreValido = value.nombre_ajuste.trim().length >= 2;

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!nombreValido) return;
        onSubmit();
      }}
      className="space-y-4"
    >
      {/* Nombre */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Nombre del ajuste</label>
        <input
          autoFocus
          value={value.nombre_ajuste}
          onChange={(e) => onChange({ ...value, nombre_ajuste: e.target.value })}
          placeholder="Ej. ISV 15% / Descuento promo"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        />
        {touched && !nombreValido && (
          <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>
        )}
      </div>

      {/* Tipo de ajuste */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Tipo de ajuste</label>
        <select
          value={value.tipo_ajuste}
          onChange={(e) => onChange({ ...value, tipo_ajuste: e.target.value as TipoAjuste })}
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        >
          <option value="Descuento">Descuento</option>
          <option value="Impuesto">Impuesto</option>
        </select>
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

export default function AjustesPage() {
  const [data, setData] = useState<Ajuste[]>(initialData);
  const [query, setQuery] = useState("");

  // Modal + edición
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ajuste | null>(null);
  const formId = "ajuste-form";

  // Filtro
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((a) =>
      [
        a.id_ajuste.toString(),
        a.nombre_ajuste.toLowerCase(),
        a.tipo_ajuste.toLowerCase(),
      ].some((s) => s.includes(q))
    );
  }, [data, query]);

  // Handlers
  const handleCreate = () => {
    setEditing({
      id_ajuste: nextId(data),
      nombre_ajuste: "",
      tipo_ajuste: "Descuento",
      disponible: true,
    });
    setOpen(true);
  };

  const handleEdit = (a: Ajuste) => {
    setEditing({ ...a });
    setOpen(true);
  };

  const handleToggleDisponible = (id: number, next?: boolean) => {
    setData((prev) =>
      prev.map((a) =>
        a.id_ajuste === id
          ? { ...a, disponible: typeof next === "boolean" ? next : !a.disponible }
          : a
      )
    );
  };

  const handleSave = () => {
    if (!editing) return;
    setData((prev) => {
      const exists = prev.some((a) => a.id_ajuste === editing.id_ajuste);
      if (exists) {
        return prev.map((a) => (a.id_ajuste === editing.id_ajuste ? editing : a));
      }
      return [...prev, editing];
    });
    setOpen(false);
    setEditing(null);
  };

  // Columnas
  const columns: Column<Ajuste>[] = [
    {
      header: "ID",
      className: "w-16 text-center",
      align: "center",
      cell: (row) => row.id_ajuste,
    },
    {
      header: "Nombre",
      className: "min-w-[220px] w-full text-left",
      align: "left",
      cell: (row) => <span className="font-medium text-neutral-900">{row.nombre_ajuste}</span>,
    },
    {
      header: "Tipo",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <span className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold">
          {row.tipo_ajuste}
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
            onChange={(next) => handleToggleDisponible(row.id_ajuste, next)}
            ariaLabel={`Cambiar disponibilidad de ${row.nombre_ajuste}`}
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
        title="Ajustes Factura"
        subtitle="Configura descuentos e impuestos."
        icon={<Percent className="h-5 w-5" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ajuste..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Nuevo ajuste
          </button>
        </div>
      </div>

      {/* Tabla */}
      <Table
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id_ajuste}
        actions={(row: Ajuste) => (
          <button
            onClick={() => handleEdit(row)}
            className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
            aria-label="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        actionsHeader="Acciones"
        ariaLabel="Tabla de ajustes"
      />

      {/* Modal */}
      <Modal
        open={!!editing && open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar ajuste" : "Nuevo ajuste"}
        icon={<Percent className="w-5 h-5" />}
        content={
          editing && (
            <AjusteForm
              value={editing}
              onChange={setEditing}
              onSubmit={handleSave}
              formId="ajuste-form"
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
              form="ajuste-form"
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

function nextId(arr: Ajuste[]) {
  return (arr.reduce((max, a) => (a.id_ajuste > max ? a.id_ajuste : max), 0) || 0) + 1;
}
