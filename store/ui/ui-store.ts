import { create } from 'zustand';

type AnyRecord = Record<string, unknown>;

interface UIState {
  isSideMenuOpen: boolean;
  isModalOpen: boolean;

  // Objeto dinámico o null
  editing: AnyRecord | null;

  openSideMenu: () => void;
  closeSideMenu: () => void;

  openModal: () => void;
  closeModal: () => void;

  // Set directo: acepta cualquier forma o null
  setEditing: <T extends AnyRecord>(value: T | null) => void;

  // Merge parcial sobre lo que ya hay en `editing`
  updateEditing: (patch: AnyRecord) => void;

  // Limpia el estado de edición
  clearEditing: () => void;

  // Útil para saber si hay algo en edición
  isEditing: () => boolean;
}

export const useUIStore = create<UIState>()((set, get) => ({
  isSideMenuOpen: false,
  isModalOpen: false,

  editing: null,

  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  setEditing: (value) => set({ editing: value }),

  updateEditing: (patch) =>
    set((state) => ({
      editing: state.editing ? { ...state.editing, ...patch } : { ...patch },
    })),

  clearEditing: () => set({ editing: null }),

  isEditing: () => get().editing !== null,
}));
