"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Tag, Search } from "lucide-react";
import { Modal, Switch, Table, Title } from "@/components";

// Si tu módulo "@/components" exporta el tipo Column, usa esta línea:
// import { Table, Title, type Column } from "@/components";

// Si NO exportas Column desde "@/components", deja este tipo local:
type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

// Tipos
interface Marca {
  id_marca: number;
  nombre_marca: string;
  disponible: boolean;
}

// Datos de ejemplo (reemplazar con fetch/DB)
const initialData: Marca[] = [
  { id_marca: 1, nombre_marca: "Acme", disponible: true },
  { id_marca: 2, nombre_marca: "Globex", disponible: false },
  { id_marca: 3, nombre_marca: "Initech", disponible: true },
];

/** Formulario para crear/editar (sin botones; el submit lo maneja el footer del modal) */
function MarcaForm({
  value,
  onChange,
  onSubmit,
  formId = "marca-form",
}: {
  value: Marca;
  onChange: (next: Marca) => void;
  onSubmit: () => void;
  formId?: string;
}) {
  const [touched, setTouched] = useState(false);
  const nombreValido = value.nombre_marca.trim().length >= 2;

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
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">
          Nombre de la marca
        </label>
        <input
          autoFocus
          value={value.nombre_marca}
          onChange={(e) =>
            onChange({ ...value, nombre_marca: e.target.value })
          }
          placeholder="Ej. Acme"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        />
        {touched && !nombreValido && (
          <p className="text-xs text-red-600">
            Debe tener al menos 2 caracteres.
          </p>
        )}
      </div>

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

export default function MarcasPage() {
  const [data, setData] = useState<Marca[]>(initialData);
  const [query, setQuery] = useState("");

  // Estado del modal y edición
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Marca | null>(null);
  const formId = "marca-form";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((m) =>
      [m.id_marca.toString(), m.nombre_marca.toLowerCase()].some((s) =>
        s.includes(q)
      )
    );
  }, [data, query]);

  // Handlers CRUD (simulados). Reemplaza con llamadas a tu API.
  const handleCreate = () => {
    setEditing({ id_marca: nextId(data), nombre_marca: "", disponible: true });
    setOpen(true);
  };

  const handleEdit = (m: Marca) => {
    setEditing({ ...m });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((m) => m.id_marca !== id));
  };

  const handleToggleDisponible = (id: number, next?: boolean) => {
    setData((prev) =>
      prev.map((m) =>
        m.id_marca === id
          ? { ...m, disponible: typeof next === "boolean" ? next : !m.disponible }
          : m
      )
    );
  };

  const handleSave = () => {
    if (!editing) return;
    setData((prev) => {
      const exists = prev.some((m) => m.id_marca === editing.id_marca);
      if (exists) {
        return prev.map((m) => (m.id_marca === editing.id_marca ? editing : m));
      }
      return [...prev, editing];
    });
    setOpen(false);
    setEditing(null);
  };

  // Columnas (con Switch en 'Disponible')
  const columns: Column<Marca>[] = [
    {
      header: "ID",
      className: "w-16 text-center",
      align: "center",
      cell: (row) => row.id_marca,
    },
    {
      header: "Nombre",
      className: "min-w-[200px] w-full text-left",
      align: "left",
      cell: (row) => (
        <span className="font-medium text-neutral-900">{row.nombre_marca}</span>
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
            onChange={(next) => handleToggleDisponible(row.id_marca, next)}
            ariaLabel={`Cambiar disponibilidad de ${row.nombre_marca}`}
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
        title="Marcas"
        subtitle="Gestiona las marcas de productos"
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar marca..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Nueva marca
          </button>
        </div>
      </div>

      {/* Tabla */}
      <Table
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id_marca}
        actions={(row: Marca) => (
          <>
            <button
              onClick={() => handleEdit(row)}
              className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
              aria-label="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id_marca)}
              className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
              aria-label="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        actionsHeader="Acciones"
        ariaLabel="Tabla de marcas"
      />

      {/* Modal de creación/edición */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar marca" : "Nueva marca"}
        icon={<Tag className="w-5 h-5" />}
        content={
          editing && (
            <MarcaForm
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

function nextId(arr: Marca[]) {
  return (
    (arr.reduce((max, m) => (m.id_marca > max ? m.id_marca : max), 0) || 0) + 1
  );
}
