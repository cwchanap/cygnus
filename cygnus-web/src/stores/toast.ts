import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  const show = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type };

    update((toasts) => [...toasts, toast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      remove(id);
    }, 5000);
  };

  const remove = (id: string) => {
    update((toasts) => toasts.filter((t) => t.id !== id));
  };

  return {
    subscribe,
    show,
    remove,
  };
}

export const toastStore = createToastStore();
