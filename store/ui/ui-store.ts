// /store/index.ts
import { create } from 'zustand';

type AnyRecord = Record<string, unknown>;
type AlertType = 'success' | 'danger' | 'warning' | 'info';

interface UIState {
  isSideMenuOpen: boolean;
  isModalOpen: boolean;

  // ALERTA
  esVisibleAlerta: boolean;
  alerta: {
    titulo: string;
    mensaje: string;
    tipo: AlertType;
  };
  mostrarAlerta: (titulo: string, mensaje: string, tipo?: AlertType) => void;
  ocultarAlerta: () => void;

  // EDITING
  editing: AnyRecord | null;
  setEditing: <T extends AnyRecord>(value: T | null) => void;
  updateEditing: (patch: AnyRecord) => void;
  clearEditing: () => void;
  isEditing: () => boolean;

  // CONFIRM
  isConfirmOpen: boolean;
  confirm: {
    titulo: string;
    mensaje: string;
    confirmText: string;
    rejectText: string;
    onConfirm?: () => void;
    preventClose?: boolean;
  };
  openConfirm: (cfg: Partial<UIState["confirm"]> & { onConfirm: () => void }) => void;
  closeConfirm: () => void;
  runConfirm: () => void;

  openSideMenu: () => void;
  closeSideMenu: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  isSideMenuOpen: false,
  isModalOpen: false,

  // ALERTA
  esVisibleAlerta: false,
  alerta: {
    titulo: '',
    mensaje: '',
    tipo: 'success', // por defecto verde
  },
  mostrarAlerta: (titulo, mensaje, tipo = 'success') =>
    set({
      esVisibleAlerta: true,
      alerta: { titulo, mensaje, tipo },
    }),
  ocultarAlerta: () =>
    set({
      esVisibleAlerta: false,
    }),

  // EDITING
  editing: null,
  setEditing: (value) => set({ editing: value }),
  updateEditing: (patch) =>
    set((state) => ({
      editing: state.editing ? { ...state.editing, ...patch } : { ...patch },
    })),
  clearEditing: () => set({ editing: null }),
  isEditing: () => get().editing !== null,

  // CONFIRM
  isConfirmOpen: false,
  confirm: {
    titulo: 'Confirmación',
    mensaje: '¿Estás seguro?',
    confirmText: 'Sí',
    rejectText: 'No',
    onConfirm: undefined,
    preventClose: false,
  },
  openConfirm: (cfg) =>
    set(() => ({
      isConfirmOpen: true,
      confirm: {
        titulo: cfg.titulo ?? 'Confirmación',
        mensaje: cfg.mensaje ?? '¿Estás seguro?',
        confirmText: cfg.confirmText ?? 'Sí',
        rejectText: cfg.rejectText ?? 'No',
        onConfirm: cfg.onConfirm,
        preventClose: cfg.preventClose ?? false,
      },
    })),
  closeConfirm: () =>
    set((state) => ({
      isConfirmOpen: false,
      confirm: { ...state.confirm, onConfirm: undefined },
    })),
  runConfirm: () =>
    set((state) => {
      state.confirm.onConfirm?.();
      return {
        isConfirmOpen: false,
        confirm: { ...state.confirm, onConfirm: undefined },
      };
    }),

  // MENU/MODAL
  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
