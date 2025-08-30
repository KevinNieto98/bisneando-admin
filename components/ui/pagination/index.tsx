'use client';

import { useState, useEffect } from "react";
import clsx from "clsx";

interface PaginationProps {
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export const Pagination = ({
  totalPages = 10,
  currentPage = 1,
  onPageChange,
}: PaginationProps) => {
  // Estado interno sincronizado con el prop currentPage
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  const handleChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    onPageChange?.(newPage);
  };

  // Genera los números de página con "..." en el medio si hay muchas páginas
  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (page >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const pages = getPages();

  return (
    <div className="flex gap-2 justify-center items-center py-4">
      {/* Prev Button (solo si page > 1) */}
      {page > 1 && (
        <button
          className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-800 text-white transition-colors"
          )}
          onClick={() => handleChange(page - 1)}
          aria-label="Anterior"
        >
          &lt;
        </button>
      )}

      {/* Page Numbers */}
      {pages.map((p, idx) =>
        p === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-10 h-10 flex items-center justify-center text-lg text-neutral-400"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors border border-neutral-200",
              page === p
                ? "bg-yellow-500 text-white"
                : "bg-white text-black-700 hover:bg-neutral-100"
            )}
            onClick={() => handleChange(Number(p))}
            aria-current={page === p ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next Button (solo si page < totalPages) */}
      {page < totalPages && (
        <button
          className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-800 text-white transition-colors"
          )}
          onClick={() => handleChange(page + 1)}
          aria-label="Siguiente"
        >
          &gt;
        </button>
      )}
    </div>
  );
};
