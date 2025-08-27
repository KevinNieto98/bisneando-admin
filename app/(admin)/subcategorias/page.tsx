"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus, Layers, Search } from "lucide-react";
import { Modal, Switch, Table, Title } from "@/components";

// 👇 Si tu módulo "@/components" exporta Column, cámbialo aquí
type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

// Tipos
interface Subcategoria {
  id_subcategoria: number;
  nombre_subcategoria: string;
  activa: boolean;
}

// Datos de ejemplo (reemplazar con fetch/DB)
const initialData: Subcategoria[] = [
  { id_subcategoria: 1, nombre_subcategoria: "Laptops", activa: true },
  { id_subcategoria: 2, nombre_subcategoria: "Smartphones", activa: true },
  { id_subcategoria: 3, nombre_subcategoria: "Accesorios", activa: false },
];

/** Formulario para crear/editar subcategoría */
function SubcategoriaForm({
  value,
  onChange,
  onSubmit,
  formId = "subcategoria-form",
}: {
  value: Subcategoria;
  onChange: (next: Subcategoria) => void;
  onSubmit: () => void;
  formId?: string;
}) {
  const [touched, setTouched] = useState(false);
  const nombreValido = value.nombre_subcategoria.trim().length >= 2;

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
          Nombre de la subcategoría
        </label>
        <input
          autoFocus
          value={value.nombre_subcategoria}
          onChange={(e) =>
            onChange({ ...value, nombre_subcategoria: e.target.value })
          }
          placeholder="Ej. Laptops"
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
          checked={value.activa}
          onChange={(next) => onChange({ ...value, activa: next })}
          ariaLabel="Cambiar estado de la subcategoría"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.activa ? "Activa" : "Inactiva"}
        </span>
      </div>
    </form>
  );
}

export default function SubcategoriasPage() {
  const [data, setData] = useState<Subcategoria[]>(initialData);
  const [query, setQuery] = useState("");

  // Estado modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subcategoria | null>(null);
  const formId = "subcategoria-form";

  // Filtro búsqueda
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((s) =>
      [s.id_subcategoria.toString(), s.nombre_subcategoria.toLowerCase()].some(
        (val) => val.includes(q)
      )
    );
  }, [data, query]);

  // Handlers CRUD
  const handleCreate = () => {
    setEditing({
      id_subcategoria: nextId(data),
      nombre_subcategoria: "",
      activa: true,
    });
    setOpen(true);
  };

  const handleEdit = (s: Subcategoria) => {
    setEditing({ ...s });
    setOpen(true);
  };

  const handleToggleActiva = (id: number, next?: boolean) => {
    setData((prev) =>
      prev.map((s) =>
        s.id_subcategoria === id
          ? { ...s, activa: typeof next === "boolean" ? next : !s.activa }
          : s
      )
    );
  };

  const handleSave = () => {
    if (!editing) return;
    setData((prev) => {
      const exists = prev.some((s) => s.id_subcategoria === editing.id_subcategoria);
      if (exists) {
        return prev.map((s) =>
          s.id_subcategoria === editing.id_subcategoria ? editing : s
        );
      }
      return [...prev, editing];
    });
    setOpen(false);
    setEditing(null);
  };

  // Columnas de tabla
  const columns: Column<Subcategoria>[] = [
    {
      header: "ID",
      className: "w-16 text-center",
      align: "center",
      cell: (row) => row.id_subcategoria,
    },
    {
      header: "Nombre",
      className: "min-w-[200px] w-full text-left",
      align: "left",
      cell: (row) => (
        <span className="font-medium text-neutral-900">{row.nombre_subcategoria}</span>
      ),
    },
    {
      header: "Estado",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={row.activa}
            onChange={(next) => handleToggleActiva(row.id_subcategoria, next)}
            ariaLabel={`Cambiar estado de ${row.nombre_subcategoria}`}
          />
          <span className="text-xs font-medium text-neutral-700">
            {row.activa ? "Activa" : "Inactiva"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header */}
      <Title
        title="Subcategorías"
        subtitle="Organiza tu catálogo"
        showBackButton
        backHref="/"
        icon={<Layers className="h-6 w-6 text-neutral-700" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar subcategoría..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nueva subcategoría
        </button>
      </div>

      {/* Tabla */}
      <Table
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id_subcategoria}
        actions={(row: Subcategoria) => (
          <button
            onClick={() => handleEdit(row)}
            className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
            aria-label="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        actionsHeader="Acciones"
        ariaLabel="Tabla de subcategorías"
      />

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar subcategoría" : "Nueva subcategoría"}
        icon={<Layers className="w-5 h-5" />}
        content={
          editing && (
            <SubcategoriaForm
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

// Generar siguiente ID incremental
function nextId(arr: Subcategoria[]) {
  return (
    (arr.reduce((max, s) => (s.id_subcategoria > max ? s.id_subcategoria : max), 0) || 0) + 1
  );
}
