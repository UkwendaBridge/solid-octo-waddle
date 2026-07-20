// Thin re-export — implementation lives in src/stores/toastStore.ts
export { useToastStore } from '../stores/toastStore';

import { useToastStore } from '../stores/toastStore';

/** Backward-compatible hook — returns { success, error, info } */
export function useToast() {
  const success = useToastStore((state) => state.success);
  const error = useToastStore((state) => state.error);
  const info = useToastStore((state) => state.info);
  return { success, error, info };
}
