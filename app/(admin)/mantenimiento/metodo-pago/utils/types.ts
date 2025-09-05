// src/utils/types.ts
export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

export interface Metodo {
  id_metodo: number;
  nombre_metodo: string;
  is_active: boolean;
}
