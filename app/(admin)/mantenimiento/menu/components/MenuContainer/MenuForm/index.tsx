"use client";

import React, { useEffect, useMemo, useState } from "react";
import { IconPicker, Switch } from "@/components";
import { getActiveMenuHeadAction } from "../../../actions";

export type MenuFormValue = {
  id_menu: number;
  nombre: string;
  subtitulo?: string | null;
  href: string;
  iconName?: string | null;
  menu?: string | null; // aquí guardaremos el NOMBRE del Menu Head elegido
  activa: boolean;
};

export type MenuFormProps = {
  value: MenuFormValue;
  onChange: (next: MenuFormValue) => void;
  onSubmit: () => void;
  formId?: string;
  onReady?: () => void;
  disabled?: boolean;
};

type ActiveMenuHead = {
  id_menu_head: number;
  nombre: string;
  is_active: boolean;
};

export function MenuForm({
  value,
  onChange,
  onSubmit,
  formId = "menu-form",
  onReady,
  disabled = false,
}: MenuFormProps) {
  const [touched, setTouched] = useState(false);

  // --- cargar menu heads activos ---
  const [heads, setHeads] = useState<ActiveMenuHead[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(true);
  const [errorHeads, setErrorHeads] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingHeads(true);
        setErrorHeads(null);
        const data = await getActiveMenuHeadAction();
        if (!alive) return;
        setHeads(Array.isArray(data) ? data : []);
      } catch {
        if (!alive) return;
        setErrorHeads("No se pudieron cargar los Menú Head activos.");
        setHeads([]);
      } finally {
        if (alive) setLoadingHeads(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // si el value.menu viene precargado pero no existe en la lista, no forzamos nada
  // si quieres forzar selección cuando carguen los heads, puedes autoasignar el primero aquí.

  const nombreValido = (value.nombre ?? "").trim().length >= 2;
  const hrefValido = useMemo(() => {
    const h = (value.href ?? "").trim();
    if (!h) return false;
    return h.startsWith("/") || /^https?:\/\//i.test(h);
  }, [value.href]);

  useEffect(() => {
    const t = setTimeout(() => onReady?.(), 0);
    return () => clearTimeout(t);
  }, [onReady]);

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        setTouched(true);
        if (!nombreValido || !hrefValido) return;
        onSubmit();
      }}
      className="space-y-4"
      noValidate
      aria-busy={disabled || loadingHeads}
    >
      {/* Nombre */}
      <div className="space-y-1.5">
        <label htmlFor="nombre" className="text-sm font-medium text-neutral-700">Nombre</label>
        <input
          id="nombre"
          autoFocus
          value={value.nombre}
          onChange={(e) => onChange({ ...value, nombre: e.target.value })}
          placeholder="Ej. Reportes"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          aria-invalid={touched && !nombreValido}
        />
        {touched && !nombreValido && (
          <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>
        )}
      </div>

      {/* Subtítulo */}
      <div className="space-y-1.5">
        <label htmlFor="subtitulo" className="text-sm font-medium text-neutral-700">Subtítulo</label>
        <input
          id="subtitulo"
          value={value.subtitulo ?? ""}
          onChange={(e) => onChange({ ...value, subtitulo: e.target.value })}
          placeholder="Ej. KPIs y métricas"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
        />
      </div>

      {/* Href */}
      <div className="space-y-1.5">
        <label htmlFor="href" className="text-sm font-medium text-neutral-700">Href</label>
        <input
          id="href"
          value={value.href}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
          placeholder="/reportes o https://tusitio.com/reporte"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60 font-mono"
          aria-invalid={touched && !hrefValido}
        />
        {touched && !hrefValido && (
          <p className="text-xs text-red-600">Debe iniciar con "/" o "http(s)://".</p>
        )}
      </div>

      {/* Icono */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Icono</label>
        <div className="flex items-center gap-3">
          <IconPicker
            value={value.iconName ?? null}
            onChange={(name) => !disabled && onChange({ ...value, iconName: name })}
          />
          {value.iconName && (
            <span className="text-xs text-neutral-600">Seleccionado: {value.iconName}</span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500">Nombre del ícono de lucide-react (p. ej. "PanelsTopLeft").</p>
      </div>

      {/* Menú / Grupo (selector de Menu Head Activo) */}
      <div className="space-y-1.5">
        <label htmlFor="menu_head_selector" className="text-sm font-medium text-neutral-700">
          Menú / Grupo (solo activos)
        </label>
        <select
          id="menu_head_selector"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          value={value.menu ?? ""}
          onChange={(e) => onChange({ ...value, menu: e.target.value })}
          disabled={disabled || loadingHeads || !!errorHeads}
        >
          <option value="" disabled>
            {loadingHeads ? "Cargando..." : "Seleccione un Menú / Grupo"}
          </option>
          {heads.map(h => (
            <option key={h.id_menu_head} value={h.nombre}>
              {h.nombre}
            </option>
          ))}
        </select>
        {errorHeads && (
          <p className="text-xs text-red-600">{errorHeads}</p>
        )}
      </div>

      {/* Estado */}
      <div className="flex items-center gap-3">
        <Switch
          checked={value.activa}
          onChange={(next: boolean) => !disabled && onChange({ ...value, activa: next })}
          ariaLabel="Cambiar estado del menú"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.activa ? "Activo" : "Inactivo"}
        </span>
      </div>
    </form>
  );
}
