"use client";

import { useMemo, useState } from "react";
import { Title } from "@/components";
import { Table, type Column } from "@/components"; // ⬅️ ajusta esta ruta si es necesario

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  blocked: boolean;
};

// 🧪 Mock de datos. Reemplaza con tu fetch real.
const initialUsers: User[] = [
  { id: "u1", name: "Ana Martínez",  email: "ana@example.com",  phone: "+504 9999-1111", orders: 12, blocked: false },
  { id: "u2", name: "Luis Gómez",    email: "luis@example.com", phone: "+504 8888-2222", orders: 4,  blocked: false },
  { id: "u3", name: "María López",   email: "maria@demo.com",    phone: "+504 7777-3333", orders: 21, blocked: true  },
  { id: "u4", name: "Carlos Pérez",  email: "carlos@demo.com",   phone: "+504 6666-4444", orders: 7,  blocked: false },
  { id: "u5", name: "Sofía Aguilar", email: "sofia@demo.com",    phone: "+504 5555-5555", orders: 0,  blocked: false },
];

export default function MenuPrincipal() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>(initialUsers);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.phone].some((v) => v.toLowerCase().includes(q))
    );
  }, [users, query]);

  const toggleBlock = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, blocked: !u.blocked } : u))
    );
    // 👉 Aquí puedes persistir:
    // await fetch(`/api/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blocked: !estadoAnterior }) })
  };

  // ✅ Definición de columnas para tu componente Table
  const columns: Column<User>[] = [
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
      header: "Bloquear",
      align: "center",
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
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                row.blocked ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`ml-2 text-sm ${row.blocked ? "text-rose-600" : "text-neutral-600"}`}>
            {row.blocked ? "Bloqueado" : "Activo"}
          </span>
        </div>
      ),
    },
    {
      header: "Pedidos",
      align: "right",
      cell: (row) => <span className="font-semibold">{row.orders}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <Title title="Usuarios" subtitle="Administra los usuarios de la plataforma" showBackButton />
      </header>

      {/* 🔎 Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono…"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm hover:text-neutral-700"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="text-sm text-neutral-600">
          {filtered.length} de {users.length} usuarios
        </div>
      </div>

      {/* 📋 Tabla usando tu API */}
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
