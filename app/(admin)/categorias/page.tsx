"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as Lucide from "lucide-react";
import { Pencil, Plus, Tags, Search } from "lucide-react";
import {
  Alert,
  Modal,
  Table,
  Title,
  Switch,
  Icono,
  ModalSkeleton,
  TableSkeleton,   // 👈 NUEVO
  Pagination,      // 👈 NUEVO
} from "@/components";
import { ConfirmDialog } from "@/components/ui/confirm-dialog"; // 👈 NUEVO
import { Categoria, CategoriaForm, FooterModal } from "./components";
import { useUIStore } from "@/store"; // <- ajusta la ruta
import { postCategoriasAction, getCategoriasAction } from "./actions";

// Datos de ejemplo (fallback)
const initialData: Categoria[] = [
  { id_categoria: 1, nombre_categoria: "Electrónica", activa: true, icono: "Cpu" },
  { id_categoria: 2, nombre_categoria: "Hogar", activa: true, icono: "Home" },
  { id_categoria: 3, nombre_categoria: "Ropa", activa: false, icono: "Shirt" },
];

type AnyIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ICONS = Lucide as unknown as Record<string, AnyIcon>;
function getIconByName(name?: string | null): AnyIcon | null {
  if (!name) return null;
  const Icon = ICONS[name as keyof typeof ICONS] as AnyIcon | undefined;
  return Icon ?? null;
}

type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

export default function CategoriasPage() {
  const [data, setData] = useState<Categoria[]>(initialData);
  const [query, setQuery] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // UI store
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm); // 👈 para ConfirmDialog

  // Modal & envío
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formId = "categoria-form";

  // Paginación (cliente)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Carga inicial desde Supabase
  useEffect(() => {
    (async () => {
      try {
        const categorias = await getCategoriasAction();
        if (Array.isArray(categorias) && categorias.length > 0) {
          setData(categorias);
        }
      } catch (e) {
        console.error("Error al cargar categorías:", e);
        mostrarAlerta("Error", "No se pudieron cargar las categorías.", "danger");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [mostrarAlerta]);

  useEffect(() => {
    if (open) setModalLoading(true);
    else setModalLoading(false);
  }, [open]);

  // Filtrado + paginado
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) =>
      [
        c.id_categoria.toString(),
        c.nombre_categoria.toLowerCase(),
        c.icono?.toLowerCase() || "",
      ].some((val) => val.includes(q))
    );
  }, [data, query]);

  // recalcular paginado al cambiar filtered o currentPage
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedData = filtered.slice(start, end);

  // Handlers
  const handleCreate = () => {
    setOpen(true);
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({
        id_categoria: nextId(data),
        nombre_categoria: "",
        activa: true,
        icono: "Tags",
      });
    }, 0);
  };

  const handleEdit = (c: Categoria) => {
    setOpen(true);
    setModalLoading(true);
    setEditing(null);
    setTimeout(() => {
      setEditing({ ...c });
    }, 0);
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

  // Confirm + save (igual patrón que Marcas)
  const handleSave = async () => {
    if (!editing) return;
    const exists = data.some((c) => c.id_categoria === editing.id_categoria);

    openConfirm({
      titulo: exists ? "Confirmar actualización" : "Confirmar creación",
      mensaje: exists
        ? `¿Deseas actualizar la categoría "${editing.nombre_categoria}"?`
        : `¿Deseas crear la categoría "${editing.nombre_categoria}"?`,
      confirmText: exists ? "Actualizar" : "Crear",
      rejectText: "Cancelar",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          await doSave({ exists });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const doSave = async ({ exists }: { exists: boolean }) => {
    try {
      if (exists) {
        // UPDATE local (si luego agregas acción para DB, la llamas aquí)
        setData((prev) =>
          prev.map((c) => (c.id_categoria === editing!.id_categoria ? editing! : c))
        );
      } else {
        // CREATE en DB
        const created = await postCategoriasAction(
          editing!.nombre_categoria,
          editing!.activa,
          editing!.icono ?? "Tags"
        );

        // Sync local usando respuesta de la DB
        setData((prev) => [
          ...prev,
          {
            id_categoria: created.id_categoria,
            nombre_categoria: created.nombre_categoria,
            activa: created.is_active,
            icono: created.icono,
          },
        ]);
      }

      setOpen(false);
      setEditing(null);

      mostrarAlerta(
        "¡Guardado!",
        exists ? "La categoría se actualizó correctamente." : "La categoría se creó correctamente.",
        "success"
      );

      // Vuelve a la primera página para ver el nuevo/actualizado
      setCurrentPage(1);
    } catch (e) {
      console.error("Error al guardar categoría:", e);
      mostrarAlerta("Error", "No se pudo guardar la categoría. Intenta de nuevo.", "danger");
    }
  };

  const columns: Column<Categoria>[] = [
    { header: "ID", className: "w-16 text-center", align: "center", cell: (row) => row.id_categoria },
    {
      header: "Icono",
      className: "w-24 text-center",
      align: "center",
      cell: (row) => {
        const Icon = getIconByName(row.icono);
        return (
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100">
              <Icono name={row.icono ?? undefined} size={16} />
            </span>
          </div>
        );
      },
    },
    {
      header: "Nombre",
      className: "min-w-[220px] w-full text-left",
      align: "left",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">{row.nombre_categoria}</span>
        </div>
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
      <Alert />

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
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1); // 👈 reset página al buscar
            }}
            placeholder="Buscar categoría..."
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          disabled={submitting}
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      {/* Tabla */}
      {initialLoading ? (
        <TableSkeleton rows={10} showActions />  
      ) : (
        <div className={submitting ? "pointer-events-none opacity-60" : ""}>
          <Table
            data={paginatedData} 
            columns={columns}
            getRowId={(row) => row.id_categoria}
            actions={(row: Categoria) => (
              <button
                onClick={() => handleEdit(row)}
                className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-60"
                aria-label="Editar"
                disabled={submitting}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            actionsHeader="Acciones"
            ariaLabel="Tabla de categorías"
          />
        </div>
      )}

      {/* Paginación */}
      <div className="mt-2 flex justify-center">
        <Pagination
          totalPages={totalPages}
          currentPage={safePage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      <Modal
        open={open}
        size="xl"
        onClose={() => {
          if (submitting) return;
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        icon={<Tags className="w-5 h-5" />}
        content={
          editing === null ? (
            <ModalSkeleton />
          ) : (
            <>
              {(modalLoading || submitting) && <ModalSkeleton />}
              <div className={(modalLoading || submitting) ? "pointer-events-none opacity-60" : ""}>
                <CategoriaForm
                  value={editing}
                  onChange={setEditing}
                  onSubmit={handleSave}
                  formId={formId}
                  onReady={() => setModalLoading(false)}
                  disabled={submitting}
                />
              </div>
            </>
          )
        }
        footer={
          <FooterModal
            formId={formId}
            onCancel={() => { if (!submitting) { setOpen(false); setEditing(null); } }}
            disabled={submitting}
          />
        }
      />

      {/* Confirm global */}
      <ConfirmDialog />
    </div>
  );
}

function nextId(arr: Categoria[]) {
  return (arr.reduce((max, c) => (c.id_categoria > max ? c.id_categoria : max), 0) || 0) + 1;
}
