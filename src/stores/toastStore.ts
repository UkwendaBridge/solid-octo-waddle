import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

let _nextId = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  success: (message) => {
    const id = _nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type: 'success' }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },

  error: (message) => {
    const id = _nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type: 'error' }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },

  info: (message) => {
    const id = _nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type: 'info' }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
