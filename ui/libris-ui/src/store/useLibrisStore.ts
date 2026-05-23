import { create } from 'zustand';

interface LibrisStore {
  openBookId: string | null;
  readerVisible: boolean;
  activeShelfId: string | null;
  setOpenBookId: (id: string | null) => void;
  setReaderVisible: (visible: boolean) => void;
  setActiveShelfId: (id: string | null) => void;
}

export const useLibrisStore = create<LibrisStore>((set) => ({
  openBookId: null,
  readerVisible: false,
  activeShelfId: null,
  setOpenBookId: (id) => set({ openBookId: id }),
  setReaderVisible: (visible) => set({ readerVisible: visible }),
  setActiveShelfId: (id) => set({ activeShelfId: id }),
}));
