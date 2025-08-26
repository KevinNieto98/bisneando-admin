import { create } from 'zustand';

interface UIState {
  isSideMenuOpen: boolean;
  isModalOpen: boolean;

  openSideMenu: () => void;
  closeSideMenu: () => void;

  openModal: () => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSideMenuOpen: false,
  isModalOpen: false,

  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
