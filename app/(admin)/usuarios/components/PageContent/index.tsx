"use client";

import { useMemo, useState, useEffect } from "react";
import { Icono, Table, Title, type Column } from "@/components";
import { HeaderTable, UserStatus, UserType } from "../HeaderTable";
import { useRouter } from "next/navigation";
import {
  getUsuariosAction,
  getPerfilesActivosAction,
  putUsuarioActivo,
  type Usuario,
} from "../../actions";
import { Pencil, Copy } from "lucide-react";

type Perfil = {
  id_perfil: number;
  nombre_perfil: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  blocked: boolean;       // inverso de is_active
  status?: UserStatus;    // "Activo" | "Inactivo"
  profileId: number;
};

export function PageContent() {
  // filtros
  const [query, setQuery] = useState("");
  const [type, setType] = useState<UserType | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");

  // datos
  const [users, setUsers] = useState<UserRow[]>([]);
  const [profiles, setProfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);

  // cargar usuarios + perfiles
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [usuarios, perfiles] = await Promise.all([
          getUsuariosAction(),
          getPerfilesActivosAction(),
        ]);

        const mappedUsers: UserRow[] = (usuarios as Usuario[]).map((u) => ({
          id: u.id, // UUID
          name: `${u.nombre} ${u.apellido}`.trim(),
          email: u.email,
          phone: u.phone ?? "",
          blocked: !u.is_active,
          status: u.is_active ? ("Activo" as UserStatus) : ("Inactivo" as UserStatus),
          profileId: u.id_perfil,
        }));

        setUsers(mappedUsers);
        setProfiles(perfiles as Perfil[]);
      } catch (err) {
        console.error("Error cargando data:", err);
        setUsers([]);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // id_perfil -> nombre_perfil
  const profileNameById = useMemo(() => {
    const m = new Map<number, string>();
    profiles.forEach((p) => m.set(p.id_perfil, p.nombre_perfil));
    return m;
  }, [profiles]);

  // opciones para HeaderTable
  const profileOptions = useMemo(
    () => profiles.map((p) => ({ id: p.id_perfil, name: p.nombre_perfil })),
    [profiles]
  );

  // filtrado
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesText =
        !q || [u.name, u.email, u.phone].some((v) => v?.toLowerCase().includes(q));

      const selectedProfileName = type || "";
      const userProfileName = profileNameById.get(u.profileId) || "";
      const matchesType = !selectedProfileName || userProfileName === selectedProfileName;

      const matchesStatus = !status || u.status === status;

      return matchesText && matchesType && matchesStatus;
    });
  }, [users, query, type, status, profileNameById]);

  // toggle con actualización en DB (optimista + rollback si falla)
  const toggleBlock = async (id: string) => {
    // estado optimista
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              blocked: !u.blocked,
              status: u.blocked ? ("Activo" as UserStatus) : ("Inactivo" as UserStatus),
            }
          : u
      )
    );

    const target = users.find((u) => u.id === id);
    if (!target) return;

    // si estaba bloqueado -> activar; si no, desactivar
    const nextIsActive = target.blocked;

    try {
      await putUsuarioActivo(id, nextIsActive);
    } catch (e) {
      console.error("No se pudo actualizar el estado en el servidor:", e);
      // rollback
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                blocked: !u.blocked,
                status: !u.blocked ? ("Activo" as UserStatus) : ("Inactivo" as UserStatus),
              }
            : u
        )
      );
    }
  };

  // columnas
  const columns: Column<UserRow>[] = [
    {
      header: "ID",
      align: "left",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-neutral-700" title={row.id}>
            {row.id.length > 10 ? `${row.id.slice(0, 8)}…` : row.id}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(row.id)}
            className="p-1 rounded hover:bg-neutral-100"
            title="Copiar ID"
            aria-label="Copiar ID"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      header: "Correo",
      align: "left",
      cell: (row) => <span className="font-medium text-neutral-900">{row.email}</span>,
    },
    {
      header: "Nombre",
      align: "left",
      cell: (row) => <span className="text-neutral-900">{row.name}</span>,
    },
    {
      header: "Teléfono",
      align: "left",
      cell: (row) => <span className="text-neutral-700">{row.phone}</span>,
    },
    {
      header: "Perfil",
      align: "center",
      cell: (row) => {
        const nombre = profileNameById.get(row.profileId);
        return (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700">
            {nombre ?? `#${row.profileId}`}
          </span>
        );
      },
    },
    {
      header: "Estado",
      align: "center",
      cell: (row) => (
        <div className="inline-flex items-center">
          <button
            onClick={() => toggleBlock(row.id)}
            role="switch"
            aria-checked={!row.blocked}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 ${
              row.blocked ? "bg-neutral-300" : "bg-emerald-500"
            }`}
            title={row.blocked ? "Activar" : "Desactivar"}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                row.blocked ? "translate-x-1" : "translate-x-5"
              }`}
            />
          </button>
          <span className={`ml-2 text-sm ${row.blocked ? "text-neutral-600" : "text-emerald-700"}`}>
            {row.blocked ? "Inactivo" : "Activo"}
          </span>
        </div>
      ),
    },
  ];

  const router = useRouter();
  const onCreate = () => router.push("/usuarios/crear");

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <Title
          title="Usuarios"
          subtitle="Administra los usuarios de la plataforma"
          showBackButton
          icon={<Icono name="User" />}
          backHref="/"
        />
      </header>

      <HeaderTable
        query={query}
        type={type}
        status={status}
        onQueryChange={setQuery}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onClearFilters={() => {
          setQuery("");
          setType("");
          setStatus("");
        }}
        onCreate={onCreate}
        shownCount={filtered.length}
        totalCount={users.length}
        profiles={profileOptions}
      />

      {loading ? (
        <p className="text-neutral-500">Cargando usuarios…</p>
      ) : (
        <Table<UserRow>
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          emptyText={query ? `No se encontraron usuarios con “${query}”.` : "No hay usuarios para mostrar."}
          ariaLabel="Tabla de usuarios"
          className="shadow-md"
          actions={(row) => (
            <>
              <button
                onClick={() => router.push(`/usuarios/${row.id}`)}
                className="inline-flex items-center rounded-lg p-2 hover:bg-neutral-100"
                aria-label="Editar usuario"
                title="Editar usuario"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
        />
      )}
    </div>
  );
}
