"use client";
import React from "react";
import clsx from "clsx";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T, index: number) => React.Key;
  actions?: (row: T) => React.ReactNode;
  emptyText?: string;
  className?: string;
  ariaLabel?: string;
  actionsHeader?: string;
  /** Ancho fijo para la columna de acciones (ej: 'w-24', 'w-32'). Default: 'w-28' */
  actionsColWidthClass?: string;
};

export function Table<T>({
  data,
  columns,
  getRowId,
  actions,
  emptyText = "No hay resultados",
  className,
  ariaLabel,
  actionsHeader = "Acciones",
  actionsColWidthClass = "w-28",
}: DataTableProps<T>) {
  return (
    <div
      className={clsx(
        "overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm",
        className
      )}
    >
      <table
        className="min-w-full text-sm table-fixed"
        aria-label={ariaLabel}
      >
        <thead className="bg-neutral-50 text-neutral-700">
          <tr className="border-b border-neutral-200">
            {actions && (
              <th
                className={clsx(
                  "px-5 py-3 font-medium text-center whitespace-nowrap",
                  actionsColWidthClass
                )}
              >
                {actionsHeader}
              </th>
            )}
            {columns.map((col, i) => (
              <th
                key={i}
                className={clsx(
                  "px-5 py-3 font-medium",
                  col.align === "right"
                    ? "text-right"
                    : col.align === "left"
                    ? "text-left"
                    : "text-center",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={(columns?.length || 0) + (actions ? 1 : 0)}
                className="px-5 py-8 text-center text-neutral-500"
              >
                {emptyText}
              </td>
            </tr>
          )}

          {data.map((row, index) => (
            <tr
              key={getRowId(row, index)}
              className="border-b last:border-b-0 border-neutral-200 hover:bg-neutral-50/60"
            >
              {actions && (
                <td
                  className={clsx(
                    "px-5 py-3 align-middle",
                    "text-center",
                    actionsColWidthClass
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    {actions(row)}
                  </div>
                </td>
              )}

              {columns.map((col, i) => (
                <td
                  key={i}
                  className={clsx(
                    "px-5 py-3 align-middle",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "left"
                      ? "text-left"
                      : "text-center"
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Subcomponentes opcionales
export const DT = {
  Th({
    children,
    align = "center",
    className = "",
  }: {
    children: React.ReactNode;
    align?: "left" | "center" | "right";
    className?: string;
  }) {
    return (
      <th
        className={clsx(
          "px-5 py-3 font-medium",
          align === "right"
            ? "text-right"
            : align === "left"
            ? "text-left"
            : "text-center",
          className
        )}
      >
        {children}
      </th>
    );
  },
  Td({
    children,
    align = "center",
    className = "",
  }: {
    children: React.ReactNode;
    align?: "left" | "center" | "right";
    className?: string;
  }) {
    return (
      <td
        className={clsx(
          "px-5 py-3 align-middle",
          align === "right"
            ? "text-right"
            : align === "left"
            ? "text-left"
            : "text-center",
          className
        )}
      >
        {children}
      </td>
    );
  },
};
