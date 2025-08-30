'use client';

import React from "react";
import { Skeleton } from "@/components";

type TableSkeletonProps = {
  /** Cantidad de filas “fantasma” */
  rows?: number;
  /** Muestra/oculta la columna de acciones para alinear el layout */
  showActions?: boolean;
};

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 10,
  showActions = true,
}) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Header */}
      <div className="grid grid-cols-[4rem_1fr_10rem] items-center gap-4 px-4 py-3 border-b border-neutral-200">
        <Skeleton className="h-4 w-10 justify-self-center" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24 justify-self-center" />
        {showActions && <Skeleton className="h-4 w-20 justify-self-end" />}
      </div>

      {/* Rows */}
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[4rem_1fr_10rem] items-center gap-4 px-4 py-3"
          >
            <Skeleton className="h-4 w-10 justify-self-center" />
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="h-6 w-10 rounded-full" /> {/* switch */}
              <Skeleton className="h-4 w-6" />
            </div>

            {showActions && (
              <div className="justify-self-end">
                <Skeleton className="h-8 w-8 rounded-lg" /> {/* botón acción */}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
