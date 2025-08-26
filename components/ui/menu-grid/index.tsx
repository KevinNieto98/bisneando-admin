// /componentes/MenuGrid.tsx
"use client";

import React from "react";

interface MenuGridProps {
  /** Tamaño del arreglo de items que vas a renderizar dentro (children.length) */
  count: number;
  /** Clases extra para el contenedor */
  className?: string;
  /** Cards o contenido a renderizar dentro del grid */
  children: React.ReactNode;
}

/**
 * MenuGrid
 * Ajusta automáticamente las columnas según `count`:
 * 1 -> 1 col
 * 2 -> sm:2 cols
 * 3 -> sm:2 cols, xl:3 cols
 * 4+ -> sm:2 cols, xl:4 cols
 */
export function MenuGrid({ count, className = "", children }: MenuGridProps) {
  let gridCols = "grid-cols-1";
  if (count === 2) {
    gridCols = "grid-cols-1 sm:grid-cols-2";
  } else if (count === 3) {
    gridCols = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  } else if (count >= 4) {
    gridCols = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
  }

  return (
    <nav
      aria-label="Menú principal"
      className={`grid gap-6 ${gridCols} ${className}`}
    >
      {children}
    </nav>
  );
}

export default MenuGrid;
