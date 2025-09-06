"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Lucide from "lucide-react";
import { Search, X, Tags } from "lucide-react";

export interface IconPickerProps {
  value?: string | null;
  onChange: (name: string) => void;
  placeholder?: string;
  className?: string;
  inlinePanel?: boolean;
  panelClassName?: string;
  panelWidthClass?: string;   // ancho configurable
  panelHeightClass?: string;  // altura configurable
}

type AnyIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const ICONS = Lucide as unknown as Record<string, AnyIcon>;
const ALL_ICON_NAMES: string[] = Object.keys(ICONS)
  .filter((k) => /^[A-Z]/.test(k) && !["Icon", "createLucideIcon", "default"].includes(k))
  .sort((a, b) => a.localeCompare(b));

function getIconByName(name?: string | null): AnyIcon | null {
  if (!name) return null;
  const Icon = ICONS[name as keyof typeof ICONS] as AnyIcon | undefined;
  return Icon ?? null;
}

export function IconPicker({
  value,
  onChange,
  placeholder = "Elegir icono",
  className = "",
  inlinePanel = false,
  panelClassName = "",
  panelWidthClass = "w-[640px] max-w-[90vw]",   // ancho por defecto
  panelHeightClass = "h-72",                    // altura por defecto
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (inlinePanel) return;
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, inlinePanel]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_ICON_NAMES;
    return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  const SelectedIcon: AnyIcon = getIconByName(value) ?? Tags;

  return (
    <div className={`w-full relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Abrir selector de iconos"
      >
        <SelectedIcon className="h-4 w-4" />
        <span className="text-neutral-800">
          {value || <span className="text-neutral-500">{placeholder}</span>}
        </span>
      </button>

      {(open || inlinePanel) && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Selector de iconos"
          className={`${
            inlinePanel
              ? "relative z-40 mt-2 w-full"
              : `absolute z-50 mt-2 ${panelWidthClass}`
          } ${panelClassName} rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl`}
        >
          <div className="flex items-center gap-2">
            <div className="relative grow">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar icono… (p. ej. pencil)"
                className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
            {!inlinePanel && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-neutral-100"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className={`mt-3 overflow-auto rounded-xl border border-neutral-100 p-1 ${panelHeightClass}`}>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {filtered.map((name) => {
                const Icon = getIconByName(name)!;
                const isActive = value === name;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => {
                      onChange(name);
                      if (!inlinePanel) setOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition
                      ${isActive ? "border-neutral-900 bg-neutral-900/5" : "border-neutral-200 hover:bg-neutral-50"}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="w-full text-center leading-tight break-words whitespace-normal text-[10px] text-neutral-600">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
