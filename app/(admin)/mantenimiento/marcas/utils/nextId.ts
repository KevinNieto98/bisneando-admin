// src/utils/nextId.ts
import type { Marca } from "./types";

export function nextId(arr: Marca[]): number {
  return (arr.reduce((max, m) => (m.id_marca > max ? m.id_marca : max), 0) || 0) + 1;
}
