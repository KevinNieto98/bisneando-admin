import { create } from 'zustand';

type AnyRecord = Record<string, unknown>;

interface UIState {
  isSideMenuOpen: boolean;
  isModalOpen: boolean;
  esVisibleAlerta: boolean;

  mostrarAlerta: (titulo: string, mensaje: string, tipo: string)  => void;
  ocultarAlerta: () => void;
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
    
  alerta: {
    titulo: string;
    mensaje: string;
    tipo: string;
  };


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
}

export const useUIStore = create<UIState>()((set, get) => ({
  isSideMenuOpen: false,
  isModalOpen: false,
    esVisibleAlerta: false,

  
  editing: null,

  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

    mostrarAlerta: (titulo: string, mensaje: string, tipo: string) => set({
     esVisibleAlerta: true, 
     alerta: { titulo, mensaje, tipo } 
  }),
  ocultarAlerta: () => set({ esVisibleAlerta: false }),


  setEditing: (value) => set({ editing: value }),

  updateEditing: (patch) =>
    set((state) => ({
      editing: state.editing ? { ...state.editing, ...patch } : { ...patch },
    })),

  clearEditing: () => set({ editing: null }),

  isEditing: () => get().editing !== null,
    alerta: {
    titulo: '',
    mensaje: '',
    tipo: 'danger',
  },


// dentro de create(...)
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
}));
