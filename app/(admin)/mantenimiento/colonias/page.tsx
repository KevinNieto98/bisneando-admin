"use client";

import React, { useMemo, useState } from "react";
import { Plus, Pencil, MapPin, Search } from "lucide-react";
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
interface Colonia {
  id_colonia: number;
  nombre_colonia: string;
  cobertura: boolean; // true/false
  fecha_actualizacion: string; // ISO string
  usuario_actualizacion: string;
  comentario?: string;
}

// Datos de ejemplo (reemplazar con fetch/DB)
const initialData: Colonia[] = [
  {
    id_colonia: 1,
    nombre_colonia: "Colonia Centro",
    cobertura: true,
    fecha_actualizacion: new Date().toISOString(),
    usuario_actualizacion: "admin",
    comentario: "Zona con alta densidad.",
  },
  {
    id_colonia: 2,
    nombre_colonia: "Colonia Norte",
    cobertura: false,
    fecha_actualizacion: new Date().toISOString(),
    usuario_actualizacion: "operaciones",
    comentario: "Pendiente de validación de rutas.",
  },
  {
    id_colonia: 3,
    nombre_colonia: "Colonia Sur",
    cobertura: true,
    fecha_actualizacion: new Date().toISOString(),
    usuario_actualizacion: "admin",
    comentario: "Entrega solo por la mañana.",
  },
];

/** Utilidad para fechas cortas */
function fmtDate(d: string) {
  try {
    const date = new Date(d);
    return new Intl.DateTimeFormat("es-HN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return d;
  }
}

/** Formulario para crear/editar (sin botones; el submit lo maneja el footer del modal) */
function ColoniaForm({
  value,
  onChange,
  onSubmit,
  formId = "colonia-form",
}: {
  value: Colonia;
  onChange: (next: Colonia) => void;
  onSubmit: () => void;
  formId?: string;
}) {
  const [touched, setTouched] = useState(false);
  const nombreValido = value.nombre_colonia.trim().length >= 2;
  const usuarioValido = value.usuario_actualizacion.trim().length >= 2;

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!nombreValido || !usuarioValido) return;
        onSubmit();
      }}
      className="space-y-4"
    >
      {/* Nombre */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">
          Nombre de la colonia
        </label>
        <input
          autoFocus
          value={value.nombre_colonia}
          onChange={(e) =>
            onChange({ ...value, nombre_colonia: e.target.value })
          }
          placeholder="Ej. Colonia Centro"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        />
        {touched && !nombreValido && (
          <p className="text-xs text-red-600">
            Debe tener al menos 2 caracteres.
          </p>
        )}
      </div>

      {/* Cobertura */}
      <div className="flex items-center gap-3">
        <Switch
          checked={value.cobertura}
          onChange={(next) => onChange({ ...value, cobertura: next })}
          ariaLabel="Cambiar cobertura"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.cobertura ? "Con cobertura" : "Sin cobertura"}
        </span>
      </div>

      {/* Usuario actualización */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">
          Usuario actualización
        </label>
        <input
          value={value.usuario_actualizacion}
          onChange={(e) =>
            onChange({ ...value, usuario_actualizacion: e.target.value })
          }
          placeholder="Ej. admin"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        />
        {touched && !usuarioValido && (
          <p className="text-xs text-red-600">
            Debe tener al menos 2 caracteres.
          </p>
        )}
      </div>

      {/* Comentario (no se muestra en la tabla, solo aquí) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">
          Comentario (opcional)
        </label>
        <textarea
          value={value.comentario ?? ""}
          onChange={(e) =>
            onChange({ ...value, comentario: e.target.value })
          }
          placeholder="Notas internas sobre la colonia…"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 min-h-[90px]"
        />
      </div>
    </form>
  );
}

export default function ColoniasPage() {
  const [data, setData] = useState<Colonia[]>(initialData);
  const [query, setQuery] = useState("");

  // Estado del modal y edición
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Colonia | null>(null);
  const formId = "colonia-form";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) =>
      [
        c.id_colonia.toString(),
        c.nombre_colonia.toLowerCase(),
        c.usuario_actualizacion.toLowerCase(),
      ].some((s) => s.includes(q))
    );
  }, [data, query]);

  // Handlers
  const handleCreate = () => {
    setEditing({
      id_colonia: nextId(data),
      nombre_colonia: "",
      cobertura: true,
      fecha_actualizacion: new Date().toISOString(),
      usuario_actualizacion: "admin",
      comentario: "",
    });
    setOpen(true);
  };

  const handleEdit = (c: Colonia) => {
    setEditing({ ...c });
    setOpen(true);
  };

  const handleToggleCobertura = (id: number, next?: boolean) => {
    setData((prev) =>
      prev.map((c) =>
        c.id_colonia === id
          ? {
              ...c,
              cobertura:
                typeof next === "boolean" ? next : !c.cobertura,
              fecha_actualizacion: new Date().toISOString(),
              usuario_actualizacion: c.usuario_actualizacion || "admin",
            }
          : c
      )
    );
  };

  const handleSave = () => {
    if (!editing) return;
    const toSave: Colonia = {
      ...editing,
      fecha_actualizacion: new Date().toISOString(),
    };
    setData((prev) => {
      const exists = prev.some((c) => c.id_colonia === toSave.id_colonia);
      if (exists) {
        return prev.map((c) => (c.id_colonia === toSave.id_colonia ? toSave : c));
      }
      return [...prev, toSave];
    });
    setOpen(false);
    setEditing(null);
  };

  // Columnas
  const columns: Column<Colonia>[] = [
    {
      header: "ID",
      className: "w-16 text-center",
      align: "center",
      cell: (row) => row.id_colonia,
    },
    {
      header: "Nombre",
      className: "min-w-[220px] w-full text-left",
      align: "left",
      cell: (row) => (
        <span className="font-medium text-neutral-900">{row.nombre_colonia}</span>
      ),
    },
    {
      header: "Cobertura",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={row.cobertura}
            onChange={(next) => handleToggleCobertura(row.id_colonia, next)}
            ariaLabel={`Cambiar cobertura de ${row.nombre_colonia}`}
          />
          <span className="text-xs font-medium text-neutral-700">
            {row.cobertura ? "Sí" : "No"}
          </span>
        </div>
      ),
    },
    {
      header: "Actualizado",
      className: "w-48 text-center",
      align: "center",
      cell: (row) => <span className="text-neutral-700">{fmtDate(row.fecha_actualizacion)}</span>,
    },
    {
      header: "Usuario",
      className: "w-40 text-center",
      align: "center",
      cell: (row) => <span className="text-neutral-700">{row.usuario_actualizacion}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header */}
      <Title
        showBackButton
        backHref="/mantenimiento"
        title="Colonias"
        subtitle="Configura zonas de entrega y catálogos."
        icon={<MapPin className="h-5 w-5" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar colonia..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Nueva colonia
          </button>
        </div>
      </div>

      {/* Tabla */}
      <Table
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id_colonia}
        actions={(row: Colonia) => (
          <button
            onClick={() => handleEdit(row)}
            className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
            aria-label="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        actionsHeader="Acciones"
        ariaLabel="Tabla de colonias"
      />

      {/* Modal de creación/edición */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar colonia" : "Nueva colonia"}
        icon={<MapPin className="w-5 h-5" />}
        content={
          editing && (
            <ColoniaForm
              value={editing}
              onChange={setEditing}
              onSubmit={handleSave}
              formId="colonia-form"
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
              form="colonia-form"
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

function nextId(arr: Colonia[]) {
  return (
    (arr.reduce((max, c) => (c.id_colonia > max ? c.id_colonia : max), 0) || 0) + 1
  );
}
