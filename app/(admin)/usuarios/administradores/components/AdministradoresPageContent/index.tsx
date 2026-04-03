"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff, Search, Info, Copy, Eye, UserPlus } from "lucide-react";
import { Alert, Modal, Table, Title, TableSkeleton } from "@/components";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUIStore } from "@/store";
import {
  getAdministradoresAction,
  getUsuariosNoAdminActivosAction,
  asignarAdminAction,
  retirarAdminAction,
  type UsuarioAdmin,
} from "../../actions";

export function AdministradoresPageContent() {
  const router       = useRouter();
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm  = useUIStore((s) => s.openConfirm);

  const [admins, setAdmins]           = useState<UsuarioAdmin[]>([]);
  const [candidatos, setCandidatos]   = useState<UsuarioAdmin[]>([]);
  const [query, setQuery]             = useState("");
  const [loading, setLoading]         = useState(true);

  // Modal asignar
  const [modalOpen, setModalOpen]     = useState(false);
  const [seleccionado, setSeleccionado] = useState<string>("");
  const [guardando, setGuardando]     = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [adminsData, candidatosData] = await Promise.all([
          getAdministradoresAction(),
          getUsuariosNoAdminActivosAction(),
        ]);
        setAdmins(adminsData);
        setCandidatos(candidatosData);
      } catch {
        mostrarAlerta("Error", "No se pudieron cargar los datos.", "danger");
      } finally {
        setLoading(false);
      }
    })();
  }, [mostrarAlerta]);

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((u) =>
      [u.nombre, u.apellido, u.email, u.phone ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [admins, query]);

  // ── Asignar ────────────────────────────────────────────────────────────────
  const abrirModal = () => {
    setSeleccionado("");
    setModalOpen(true);
  };

  const handleAsignar = async () => {
    if (!seleccionado) {
      mostrarAlerta("Sin selección", "Selecciona un usuario.", "warning");
      return;
    }

    const usuario = candidatos.find((u) => u.id === seleccionado);
    if (!usuario) return;
    const nombre = `${usuario.nombre} ${usuario.apellido}`.trim();

    setGuardando(true);
    try {
      await asignarAdminAction(seleccionado);

      // Mover al estado local: sale de candidatos, entra a admins
      setCandidatos((prev) => prev.filter((u) => u.id !== seleccionado));
      setAdmins((prev) => [...prev, { ...usuario }].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      ));

      setModalOpen(false);
      mostrarAlerta("¡Asignado!", `${nombre} ahora es administrador.`, "success");
    } catch {
      mostrarAlerta("Error", "No se pudo asignar el perfil.", "danger");
    } finally {
      setGuardando(false);
    }
  };

  // ── Retirar ────────────────────────────────────────────────────────────────
  const handleRetirar = (usuario: UsuarioAdmin) => {
    const nombre = `${usuario.nombre} ${usuario.apellido}`.trim();

    openConfirm({
      titulo:      "Retirar administración",
      mensaje:     `¿Deseas retirar los permisos de administrador a "${nombre}"? Volverá a ser Cliente.`,
      confirmText: "Sí, retirar",
      rejectText:  "Cancelar",
      onConfirm: async () => {
        try {
          await retirarAdminAction(usuario.id);

          // Sale de admins, vuelve a candidatos
          setAdmins((prev) => prev.filter((u) => u.id !== usuario.id));
          setCandidatos((prev) =>
            [...prev, { ...usuario }].sort((a, b) => a.nombre.localeCompare(b.nombre))
          );

          mostrarAlerta("Retirado", `${nombre} ya no es administrador.`, "success");
        } catch {
          mostrarAlerta("Error", "No se pudo retirar el perfil.", "danger");
        }
      },
    });
  };

  const hasNoResults = !loading && filtered.length === 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Alert />

      <Title
        title="Administradores"
        subtitle="Usuarios con acceso de administrador"
        showBackButton
        backHref="/"
        icon={<ShieldCheck className="h-6 w-6 text-neutral-700" />}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
            Total: <strong className="text-neutral-900">{admins.length}</strong>
          </span>
          {query && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
              Resultados: <strong className="text-neutral-900">{filtered.length}</strong>
            </span>
          )}
        </div>

        <button
          onClick={abrirModal}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <UserPlus className="w-4 h-4" />
          Asignar administración
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <TableSkeleton rows={6} showActions />
      ) : hasNoResults ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <Info className="h-6 w-6 text-neutral-500" />
          <p className="text-sm text-neutral-600">
            {query
              ? <>No hay resultados para <span className="font-semibold">"{query}"</span>.</>
              : "No hay administradores registrados."}
          </p>
        </div>
      ) : (
        <Table
          data={filtered}
          columns={[
            {
              header: "ID",
              align: "left",
              className: "w-36",
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-neutral-600" title={row.id}>
                    {row.id.slice(0, 8)}…
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(row.id)}
                    className="p-1 rounded hover:bg-neutral-100"
                    title="Copiar ID"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
              ),
            },
            {
              header: "Nombre",
              align: "left",
              cell: (row) => (
                <span className="font-medium text-neutral-900">
                  {`${row.nombre} ${row.apellido}`.trim() || "—"}
                </span>
              ),
            },
            {
              header: "Correo",
              align: "left",
              cell: (row) => <span className="text-neutral-700">{row.email}</span>,
            },
            {
              header: "Teléfono",
              align: "left",
              cell: (row) => <span className="text-neutral-600">{row.phone ?? "—"}</span>,
            },
            {
              header: "Estado",
              align: "center",
              className: "w-28",
              cell: (row) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  row.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                }`}>
                  {row.is_active ? "Activo" : "Inactivo"}
                </span>
              ),
            },
          ]}
          getRowId={(row) => row.id}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push(`/usuarios/${row.id}`)}
                className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
                title="Ver usuario"
              >
                <Eye className="w-4 h-4 text-neutral-600" />
              </button>
              <button
                onClick={() => handleRetirar(row)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                title="Retirar administración"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Retirar
              </button>
            </div>
          )}
          actionsHeader="Acciones"
          ariaLabel="Tabla de administradores"
        />
      )}

      {/* Modal asignar */}
      <Modal
        open={modalOpen}
        size="sm"
        onClose={() => { if (!guardando) setModalOpen(false); }}
        title="Asignar administración"
        icon={<ShieldCheck className="w-5 h-5" />}
        content={
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Selecciona un usuario activo para otorgarle permisos de administrador.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="usuario-selector" className="text-sm font-medium text-neutral-700">
                Usuario
              </label>
              <select
                id="usuario-selector"
                value={seleccionado}
                onChange={(e) => setSeleccionado(e.target.value)}
                disabled={guardando}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60"
              >
                <option value="">— Selecciona un usuario —</option>
                {candidatos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {`${u.nombre} ${u.apellido}`.trim()} — {u.email}
                  </option>
                ))}
              </select>

              {candidatos.length === 0 && (
                <p className="text-xs text-amber-600">
                  No hay usuarios activos disponibles para asignar.
                </p>
              )}
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setModalOpen(false)}
              disabled={guardando}
              className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              onClick={handleAsignar}
              disabled={guardando || !seleccionado}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              {guardando ? "Guardando…" : "Asignar"}
            </button>
          </div>
        }
      />

      <ConfirmDialog />
    </div>
  );
}
