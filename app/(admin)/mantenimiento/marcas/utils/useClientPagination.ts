// src/utils/useClientPagination.ts
import { useEffect, useMemo, useState } from "react";

export function useClientPagination<T>(items: T[], pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return { currentPage, setCurrentPage, totalPages, pageItems };
}
