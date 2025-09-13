"use client";

import { useMemo, useState } from "react";

import { Icono, Table, Title, type Column } from "@/components"; // ajusta ruta
import { HeaderTable, UserStatus, UserType } from "../HeaderTable";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  blocked: boolean;
  type?: UserType;   // ⬅️ si quieres guardar tipo por usuario
  status?: UserStatus; // ⬅️ si quieres guardar estado por usuario
};

// 🧪 Mock: añadí campos opcionales type/status para ejemplificar el filtrado
const initialUsers: User[] = [
  { id: "u1", name: "Ana Martínez",  email: "ana@example.com",  phone: "+504 9999-1111", orders: 12, blocked: false, type: "Administrador", status: "Activo" },
  { id: "u2", name: "Luis Gómez",    email: "luis@example.com", phone: "+504 8888-2222", orders: 4,  blocked: false, type: "Cliente",      status: "Activo" },
  { id: "u3", name: "María López",   email: "maria@demo.com",    phone: "+504 7777-3333", orders: 21, blocked: true,  type: "Bodega",       status: "Inactivo" },
  { id: "u4", name: "Carlos Pérez",  email: "carlos@demo.com",   phone: "+504 6666-4444", orders: 7,  blocked: false, type: "Prueba",       status: "Activo" },
  { id: "u5", name: "Sofía Aguilar", email: "sofia@demo.com",    phone: "+504 5555-5555", orders: 0,  blocked: false, type: "Cliente",      status: "Activo" },
];

export function PageContent() {
  // estado de filtros
  const [query, setQuery] = useState("");
  const [type, setType] = useState<UserType>("");
  const [status, setStatus] = useState<UserStatus>("");

  // datos
  const [users, setUsers] = useState<User[]>(initialUsers);

  // filtrado combinado
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesText =
        !q ||
        [u.name, u.email, u.phone].some((v) => v?.toLowerCase().includes(q));

      const matchesType = !type || u.type === type;
      const matchesStatus = !status || u.status === status;

      return matchesText && matchesType && matchesStatus;
    });
  }, [users, query, type, status]);

  const toggleBlock = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, blocked: !u.blocked } : u))
    );
  };

  // columnas
  const columns: Column<User>[] = [
    { header: "Correo", align: "left", cell: (row) => <span className="font-medium text-neutral-900">{row.email}</span> },
    { header: "Nombre", align: "left", cell: (row) => <span className="text-neutral-900">{row.name}</span> },
    { header: "Teléfono", align: "left", cell: (row) => <span className="text-neutral-700">{row.phone}</span> },
    {
      header: "Bloquear", align: "center",
      cell: (row) => (
        <div className="inline-flex items-center">
          <button
            onClick={() => toggleBlock(row.id)}
            role="switch"
            aria-checked={row.blocked}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 ${
              row.blocked ? "bg-rose-500" : "bg-neutral-300"
            }`}
            title={row.blocked ? "Desbloquear" : "Bloquear"}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${row.blocked ? "translate-x-5" : "translate-x-1"}`} />
          </button>
          <span className={`ml-2 text-sm ${row.blocked ? "text-rose-600" : "text-neutral-600"}`}>
            {row.blocked ? "Bloqueado" : "Activo"}
          </span>
        </div>
      ),
    },
    { header: "Pedidos", align: "right", cell: (row) => <span className="font-semibold">{row.orders}</span> },
  ];
  const router = useRouter()
  const onCreate = () => { router.push('/usuarios/crear-usuaurios') }
  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <Title
          title="Usuarios"
          subtitle="Administra los usuarios de la plataforma"
          showBackButton
          icon={<Icono name="User" />} // usa tu wrapper
          backHref="/"
        />
      </header>

      {/* HeaderTable reutilizable */}
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
      />

      <Table<User>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        emptyText={`No se encontraron usuarios con “${query}”.`}
        ariaLabel="Tabla de usuarios"
        className="shadow-md"
      />
    </div>
  );
}
