"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus, Tags, Search } from "lucide-react";
import { Modal, Switch, Table, Title } from "@/components";

// 👇 Tipo genérico Column (si no lo exportas desde "@/components")
type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

// Tipos
interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  activa: boolean;
}

// Datos de ejemplo (reemplazar con fetch/DB)
const initialData: Categoria[] = [
  { id_categoria: 1, nombre_categoria: "Electrónica", activa: true },
  { id_categoria: 2, nombre_categoria: "Hogar", activa: true },
  { id_categoria: 3, nombre_categoria: "Ropa", activa: false },
];

/** Formulario de creación/edición */
function CategoriaForm({
  value,
  onChange,
  onSubmit,
  formId = "categoria-form",
}: {
  value: Categoria;
  onChange: (next: Categoria) => void;
  onSubmit: () => void;
  formId?: string;
}) {
  const [touched, setTouched] = useState(false);
  const nombreValido = value.nombre_categoria.trim().length >= 2;

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
          Nombre de la categoría
        </label>
        <input
          autoFocus
          value={value.nombre_categoria}
          onChange={(e) =>
            onChange({ ...value, nombre_categoria: e.target.value })
          }
          placeholder="Ej. Electrónica"
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
          ariaLabel="Cambiar estado de la categoría"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.activa ? "Activa" : "Inactiva"}
        </span>
      </div>
    </form>
  );
}

export default function CategoriasPage() {
  const [data, setData] = useState<Categoria[]>(initialData);
  const [query, setQuery] = useState("");

  // Estado modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const formId = "categoria-form";

  // Filtrado búsqueda
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) =>
      [c.id_categoria.toString(), c.nombre_categoria.toLowerCase()].some(
        (val) => val.includes(q)
      )
    );
  }, [data, query]);

  // Handlers CRUD
  const handleCreate = () => {
    setEditing({
      id_categoria: nextId(data),
      nombre_categoria: "",
      activa: true,
    });
    setOpen(true);
  };

  const handleEdit = (c: Categoria) => {
    setEditing({ ...c });
    setOpen(true);
  };

  const handleToggleActiva = (id: number, next?: boolean) => {
    setData((prev) =>
      prev.map((c) =>
        c.id_categoria === id
          ? { ...c, activa: typeof next === "boolean" ? next : !c.activa }
          : c
      )
    );
  };

  const handleSave = () => {
    if (!editing) return;
    setData((prev) => {
      const exists = prev.some((c) => c.id_categoria === editing.id_categoria);
      if (exists) {
        return prev.map((c) =>
          c.id_categoria === editing.id_categoria ? editing : c
        );
      }
      return [...prev, editing];
    });
    setOpen(false);
    setEditing(null);
  };

  // Columnas
  const columns: Column<Categoria>[] = [
    {
      header: "ID",
      className: "w-16 text-center",
      align: "center",
      cell: (row) => row.id_categoria,
    },
    {
      header: "Nombre",
      className: "min-w-[200px] w-full text-left",
      align: "left",
      cell: (row) => (
        <span className="font-medium text-neutral-900">
          {row.nombre_categoria}
        </span>
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
            onChange={(next) => handleToggleActiva(row.id_categoria, next)}
            ariaLabel={`Cambiar estado de ${row.nombre_categoria}`}
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
        title="Categorías"
        subtitle="Catálogo de Categorías"
        showBackButton
        backHref="/"
        icon={<Tags className="h-6 w-6 text-neutral-700" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      {/* Tabla */}
      <Table
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id_categoria}
        actions={(row: Categoria) => (
          <button
            onClick={() => handleEdit(row)}
            className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
            aria-label="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        actionsHeader="Acciones"
        ariaLabel="Tabla de categorías"
      />

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        icon={<Tags className="w-5 h-5" />}
        content={
          editing && (
            <CategoriaForm
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

// Generador de ID incremental
function nextId(arr: Categoria[]) {
  return (
    (arr.reduce(
      (max, c) => (c.id_categoria > max ? c.id_categoria : max),
      0
    ) || 0) + 1
  );
}
