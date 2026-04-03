"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, Info, Copy, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, Table, Title, TableSkeleton } from "@/components";
import { getUsuariosByPerfilAction, type Usuario } from "../../actions";

type Props = {
  perfilId: number;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

export function UsuariosTablaByPerfil({ perfilId, title, subtitle, icon }: Props) {
  const router = useRouter();
  const [data, setData] = useState<Usuario[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const usuarios = await getUsuariosByPerfilAction(perfilId);
        setData(usuarios);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [perfilId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((u) =>
      [u.nombre, u.apellido, u.email, u.phone ?? ""]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [data, query]);

  const hasNoResults = !loading && filtered.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Alert />

      <Title
        title={title}
        subtitle={subtitle}
        showBackButton
        backHref="/"
        icon={icon}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono…"
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
            Total: <strong className="text-neutral-900">{data.length}</strong>
          </span>
          {query && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1">
              Resultados: <strong className="text-neutral-900">{filtered.length}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <TableSkeleton rows={8} showActions={false} />
      ) : hasNoResults ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <Info className="h-6 w-6 text-neutral-500" />
          <p className="text-sm text-neutral-600">
            {query
              ? <>No hay resultados para <span className="font-semibold">"{query}"</span>.</>
              : "No hay usuarios registrados en esta categoría."}
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
              cell: (row) => (
                <span className="text-neutral-600">{row.phone ?? "—"}</span>
              ),
            },
            {
              header: "Estado",
              align: "center",
              className: "w-28",
              cell: (row) => (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    row.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {row.is_active ? "Activo" : "Inactivo"}
                </span>
              ),
            },
          ]}
          getRowId={(row) => row.id}
          actions={(row) => (
            <button
              onClick={() => router.push(`/usuarios/${row.id}`)}
              className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
              title="Ver usuario"
              aria-label="Ver usuario"
            >
              <Eye className="w-4 h-4 text-neutral-600" />
            </button>
          )}
          actionsHeader="Ver"
          ariaLabel={`Tabla de ${title.toLowerCase()}`}
        />
      )}
    </div>
  );
}
