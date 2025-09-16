"use client";
import { Button, Icono } from "@/components";
import React from "react";

// Ahora permite strings dinámicos desde DB (nombre_perfil)
export type UserType = "" | string;
export type UserStatus = "" | "Activo" | "Inactivo";

type Props = {
  // Estado controlado
  query: string;
  type: UserType;
  status: UserStatus;

  // Callbacks controlados
  onQueryChange: (v: string) => void;
  onTypeChange: (v: UserType) => void;
  onStatusChange: (v: UserStatus) => void;

  // Acciones
  onClearFilters: () => void;
  onCreate: () => void;

  // UI/Info
  shownCount: number;
  totalCount: number;
  className?: string;

  // 🔽 Nuevo: perfiles activos (para poblar el select)
  profiles: Array<{ id: number; name: string }>;
};

export function HeaderTable({
  query,
  type,
  status,
  onQueryChange,
  onTypeChange,
  onStatusChange,
  onClearFilters,
  onCreate,
  shownCount,
  totalCount,
  className,
  profiles,
}: Props) {
  return (
    <div
      className={[
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* 🔎 Buscador */}
      <div className="relative w-full sm:max-w-md">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por nombre, correo o teléfono…"
          className="w-full rounded-2xl border border-neutral-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
          aria-label="Buscar usuarios"
        />
        {!!query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm hover:text-neutral-700"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* 📋 Filtros + Acciones */}
      <div className="flex flex-wrap items-center gap-3">
        {/* contador */}
        <div className="text-sm text-neutral-600 ml-auto">
          {shownCount} de {totalCount} usuarios
        </div>

        {/* Tipo de usuario (dinámico desde perfiles activos) */}
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as UserType)}
          className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
          aria-label="Filtrar por tipo de usuario"
        >
          <option value="">Tipo de Usuario</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Estado */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as UserStatus)}
          className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
          aria-label="Filtrar por estado"
        >
          <option value="">Estado</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        {/* 🧹 Limpiar Filtros */}
        <Button
          variant="white"
          icon={<Icono name="Eraser" size={16} />}
          onClick={onClearFilters}
        >
          Limpiar filtros
        </Button>

        {/* ➕ Crear Usuario */}
        <Button
          variant="blue"
          icon={<Icono name="UserPlus" size={16} />}
          onClick={onCreate}
        >
          Crear Usuario
        </Button>
      </div>
    </div>
  );
}
