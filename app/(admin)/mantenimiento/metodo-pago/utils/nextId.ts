// src/utils/nextId.ts
import type { Metodo } from "./types";

export function nextId(arr: Metodo[]): number {
  return (arr.reduce((max, m) => (m.id_metodo > max ? m.id_metodo : max), 0) || 0) + 1;
}
