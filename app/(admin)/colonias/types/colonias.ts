export type Colonia = {
  id_colonia: number;
  nombre_colonia: string;
  activa: boolean;           // mapea a is_active
  tiene_cobertura: boolean;
  referencia: string | null;
  updated_at: string;        // ISO
};