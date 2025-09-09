// =============================
// /app/menus/MenuContainer.tsx
// =============================
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, PanelsTopLeft, Search, Info, ExternalLink } from "lucide-react";
import {
    Alert,
    Modal,
    Table,
    Title,
    Switch,
    Icono,
    ModalSkeleton,
    TableSkeleton,
    Pagination,
    Button,
} from "@/components";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { useUIStore } from "@/store";
import { getMenusAction, postMenusAction, putMenusAction } from "../../actions";
import { clampPage, ensureIcon, filterMenus, mapDbToUi, nextId, slicePage } from "../../utils";
import { MenuForm } from "./MenuForm";
import { FooterModal } from "./FooterModal";


export type MenuUI = {
    id_menu: number;
    nombre: string;
    subtitulo?: string | null;
    href: string;
    iconName?: string | null;
    menu?: string | null; // grupo/padre
    activa: boolean; // mapea a is_active
};

// Datos de ejemplo (fallback)
const initialData: MenuUI[] = [
    { id_menu: 1, nombre: "Dashboard", subtitulo: "Inicio", href: "/", iconName: "Home", menu: "general", activa: true },
    { id_menu: 2, nombre: "Reportes", subtitulo: "KPIs", href: "/reportes", iconName: "BarChart3", menu: "analitica", activa: true },
    { id_menu: 3, nombre: "Usuarios", subtitulo: null, href: "/usuarios", iconName: "Users", menu: "config", activa: false },
];

type Column<T> = {
    header: string;
    cell: (row: T) => React.ReactNode;
    align?: "left" | "center" | "right";
    className?: string;
};

export function MenuContainer() {
    const [data, setData] = useState<MenuUI[]>(initialData);
    const [query, setQuery] = useState("");
    const [menuFilter, setMenuFilter] = useState<string>(""); // "" = Todos
    const [initialLoading, setInitialLoading] = useState(true);

    // UI store
    const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
    const openConfirm = useUIStore((s) => s.openConfirm);

    // Modal & envío
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<MenuUI | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const formId = "menu-form";

    // Paginación (cliente)
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // Carga inicial
    useEffect(() => {
        (async () => {
            try {
                const rows = await getMenusAction();
                if (Array.isArray(rows) && rows.length > 0) {
                    setData(rows.map(mapDbToUi));
                }
            } catch (e) {
                console.error("Error al cargar menús:", e);
                mostrarAlerta("Error", "No se pudieron cargar los menús.", "danger");
            } finally {
                setInitialLoading(false);
            }
        })();
    }, [mostrarAlerta]);

    useEffect(() => {
        setModalLoading(open);
    }, [open]);

    // Filtrado + paginado
    const menuOptions = useMemo(() => {
        const set = new Set<string>(["PRINCIPAL", "MANTENIMIENTO"]); // predefinidas
        data.forEach((m) => m.menu && set.add(String(m.menu)));
        return Array.from(set);
    }, [data]);

    const filteredByQuery = useMemo(() => filterMenus(data, query), [data, query]);

    const filtered = useMemo(() => {
        if (!menuFilter) return filteredByQuery; // sin filtro -> todos
        return filteredByQuery.filter(
            (m) => (m.menu ?? "").toLowerCase() === menuFilter.toLowerCase(),
        );
    }, [filteredByQuery, menuFilter]);

    const pages = useMemo(() => getTotalPages(filtered.length, PAGE_SIZE), [filtered.length]);
    const safePage = clampPage(currentPage, pages);
    const paginatedData = useMemo(
        () => slicePage(filtered, safePage, PAGE_SIZE),
        [filtered, safePage],
    );

    // Handlers
    const handleCreate = () => {
        setOpen(true);
        setModalLoading(true);
        setEditing(null);
        setTimeout(() => {
            setEditing({
                id_menu: nextId(data),
                nombre: "",
                subtitulo: "",
                href: "/",
                iconName: ensureIcon(null), // ej. "PanelsTopLeft"
                menu: "",
                activa: true,
            });
        }, 0);
    };

    const handleEdit = (row: MenuUI) => {
        setOpen(true);
        setModalLoading(true);
        setEditing(null);
        setTimeout(() => setEditing({ ...row }), 0);
    };

    const handleToggleActiva = async (id: number, next?: boolean) => {
        // Optimistic UI
        setData((prev) =>
            prev.map((m) => (m.id_menu === id ? { ...m, activa: typeof next === "boolean" ? next : !m.activa } : m)),
        );

        try {
            const row = data.find((m) => m.id_menu === id);
            if (!row) return;
            const nuevaActiva = typeof next === "boolean" ? next : !row.activa;

            const updated = await putMenusAction({
                id_menu: id,
                nombre: row.nombre,
                subtitulo: row.subtitulo ?? null,
                href: row.href,
                icon_name: row.iconName ?? null,
                menu: row.menu ?? null,
                is_active: nuevaActiva,
            });

            setData((prev) =>
                prev.map((m) =>
                    m.id_menu === updated.id_menu
                        ? {
                            id_menu: updated.id_menu,
                            nombre: updated.nombre,
                            subtitulo: updated.subtitulo,
                            href: updated.href,
                            iconName: updated.icon_name,
                            menu: updated.menu,
                            activa: updated.is_active,
                        }
                        : m,
                ),
            );
        } catch (e) {
            console.error("Error al actualizar estado:", e);
            mostrarAlerta("Error", "No se pudo actualizar el estado.", "danger");
            // rollback
            setData((prev) => prev.map((m) => (m.id_menu === id ? { ...m, activa: !m.activa } : m)));
        }
    };

    const handleSave = async () => {
        if (!editing) return;
        const exists = data.some((m) => m.id_menu === editing.id_menu);

        openConfirm({
            titulo: exists ? "Confirmar actualización" : "Confirmar creación",
            mensaje: exists
                ? `¿Deseas actualizar el menú "${editing.nombre}"?`
                : `¿Deseas crear el menú "${editing.nombre}"?`,
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
            if (!editing) return;

            if (exists) {
                const updated = await putMenusAction({
                    id_menu: editing.id_menu,
                    nombre: editing.nombre,
                    subtitulo: editing.subtitulo ?? null,
                    href: editing.href,
                    icon_name: editing.iconName ?? null,
                    menu: editing.menu ?? null,
                    is_active: editing.activa,
                });

                setData((prev) =>
                    prev.map((m) =>
                        m.id_menu === updated.id_menu
                            ? {
                                id_menu: updated.id_menu,
                                nombre: updated.nombre,
                                subtitulo: updated.subtitulo,
                                href: updated.href,
                                iconName: updated.icon_name,
                                menu: updated.menu,
                                activa: updated.is_active,
                            }
                            : m,
                    ),
                );
            } else {
                const created = await postMenusAction({
                    nombre: editing.nombre,
                    subtitulo: editing.subtitulo ?? null,
                    href: editing.href,
                    icon_name: ensureIcon(editing.iconName, "PanelsTopLeft"),
                    menu: editing.menu ?? null,
                    is_active: editing.activa,
                });

                setData((prev) => [
                    ...prev,
                    {
                        id_menu: created.id_menu,
                        nombre: created.nombre,
                        subtitulo: created.subtitulo,
                        href: created.href,
                        iconName: created.icon_name,
                        menu: created.menu,
                        activa: created.is_active,
                    },
                ]);
            }

            setOpen(false);
            setEditing(null);

            mostrarAlerta(
                "¡Guardado!",
                exists ? "El menú se actualizó correctamente." : "El menú se creó correctamente.",
                "success",
            );

            setCurrentPage(1);
        } catch (e) {
            console.error("Error al guardar menú:", e);
            mostrarAlerta("Error", "No se pudo guardar el menú. Intenta de nuevo.", "danger");
        }
    };

    const columns: Column<MenuUI>[] = [
        { header: "ID", className: "w-16 text-center", align: "center", cell: (row) => row.id_menu },
        {
            header: "Icono",
            className: "w-24 text-center",
            align: "center",
            cell: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100">
                        <Icono name={row.iconName ?? undefined} size={16} />
                    </span>
                </div>
            ),
        },
        {
            header: "Nombre",
            className: "min-w-[260px] w-full text-left",
            align: "left",
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">{row.nombre}</span>
                    {row.subtitulo && (
                        <span className="text-xs text-neutral-600 leading-tight">{row.subtitulo}</span>
                    )}
                </div>
            ),
        },
        {
            header: "Ruta",
            className: "min-w-[220px] text-left",
            align: "left",
            cell: (row) => (
                <a
                    href={row.href}
                    className="inline-flex items-center gap-1 text-sm text-neutral-700 hover:underline"
                    title={row.href}
                >
                    <span className="font-mono">{row.href}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            ),
        },
        {
            header: "Menú",
            className: "w-40 text-left",
            align: "left",
            cell: (row) => <span className="text-sm text-neutral-800">{row.menu || "—"}</span>,
        },
        {
            header: "Estado",
            className: "w-40 text-center",
            align: "center",
            cell: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <Switch
                        checked={row.activa}
                        onChange={(next) => handleToggleActiva(row.id_menu, next)}
                        ariaLabel={`Cambiar estado de ${row.nombre}`}
                    />
                    <span
                        className={`text-xs font-medium ${row.activa ? "text-emerald-700" : "text-neutral-600"}`}
                        title={row.activa ? "Visible para los usuarios" : "Oculto para los usuarios"}
                    >
                        {row.activa ? "Activo" : "Inactivo"}
                    </span>
                </div>
            ),
        },
    ];

    const hasNoResults = !initialLoading && filtered.length === 0;

    return (
        <div className="max-w-7xl mx-auto px-6 py-4">
            <Alert />



            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
                <div className="flex w-full gap-3">
                    {/* Buscador */}
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar menú..."
                            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
                        />
                    </div>

                    {/* Selector de menú/grupo */}
                    <div className="w-40">
                        <select
                            value={menuFilter}
                            onChange={(e) => {
                                setMenuFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
                            aria-label="Filtrar por grupo de menú"
                        >
                            <option value="">Todos</option>
                            {menuOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* Contadores */}
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
                        Total: <strong className="text-neutral-900">{data.length}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
                        Coincidencias: <strong className="text-neutral-900">{filtered.length}</strong>
                    </span>
                    {menuFilter && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
                            Filtro: <strong className="text-neutral-900">{menuFilter}</strong>
                        </span>
                    )}
                </div>

                <Button
                    onClick={handleCreate}
                    variant="success"
                    icon={<Plus className="w-4 h-4" />}
                    disabled={submitting}
                >
                    Nuevo
                </Button>
            </div>

            {/* Tabla o estado vacío */}
            {initialLoading ? (
                <TableSkeleton rows={10} showActions />
            ) : hasNoResults ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
                    <Info className="h-6 w-6 text-neutral-500" />
                    <div className="text-sm text-neutral-600">
                        No hay resultados para <span className="font-semibold text-neutral-900">“{query}”</span>.
                    </div>
                    <div className="text-xs text-neutral-500">Prueba con otro término o limpia la búsqueda.</div>
                </div>
            ) : (
                <div className={submitting ? "pointer-events-none opacity-60" : ""}>
                    <Table
                        data={paginatedData}
                        columns={columns}
                        getRowId={(row) => row.id_menu}
                        actions={(row: MenuUI) => (
                            <button
                                onClick={() => handleEdit(row)}
                                className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-60"
                                aria-label="Editar"
                                disabled={submitting}
                                title="Editar menú"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                        actionsHeader="Acciones"
                        ariaLabel="Tabla de menús"
                    />
                </div>
            )}

            {/* Paginación */}
            {!hasNoResults && (
                <div className="mt-2 flex justify-center">
                    <Pagination totalPages={pages} currentPage={safePage} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* Modal */}
            <Modal
                open={open}
                size="xl"
                onClose={() => {
                    if (submitting) return;
                    setOpen(false);
                    setEditing(null);
                }}
                title={editing ? "Editar menú" : "Nuevo menú"}
                icon={<PanelsTopLeft className="w-5 h-5" />}
                content={
                    editing === null ? (
                        <ModalSkeleton />
                    ) : (
                        <>
                            {(modalLoading || submitting) && <ModalSkeleton />}
                            <div className={modalLoading || submitting ? "pointer-events-none opacity-60" : ""}>
                                <MenuForm
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
                        onCancel={() => {
                            if (!submitting) {
                                setOpen(false);
                                setEditing(null);
                            }
                        }}
                        disabled={submitting}
                    />
                }
            />

            {/* Confirm global */}
            <ConfirmDialog />
        </div>
    );
}
function getTotalPages(length: number, pageSize: number): number {
    const size = Math.max(1, pageSize);
    return Math.max(1, Math.ceil(length / size));
}
