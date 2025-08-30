// src/utils/types.ts
export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

export interface Marca {
  id_marca: number;
  nombre_marca: string;
  is_active: boolean;
}
