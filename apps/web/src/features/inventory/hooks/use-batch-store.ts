import { create } from 'zustand';

interface BatchState {
  isProcessing: boolean;
  total: number;
  current: number;
  itemName: string;
  isSuccess: boolean;
  startBatch: (total: number, itemName: string) => void;
  updateProgress: (current: number) => void;
  completeBatch: () => void;
  reset: () => void;
}

export const useBatchStore = create<BatchState>((set) => ({
  isProcessing: false,
  total: 0,
  current: 0,
  itemName: '',
  isSuccess: false,
  startBatch: (total, itemName) => set({ isProcessing: true, total, current: 0, itemName, isSuccess: false }),
  updateProgress: (current) => set({ current }),
  completeBatch: () => set({ isSuccess: true }),
  reset: () => set({ isProcessing: false, total: 0, current: 0, itemName: '', isSuccess: false }),
}));
