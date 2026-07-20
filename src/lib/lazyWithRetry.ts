import { lazy, type ComponentType } from 'react';

/**
 * Wraps React.lazy so that a failed dynamic import — typically caused by a
 * stale index.html referencing chunk hashes that no longer exist after a
 * redeploy ("Failed to fetch dynamically imported module") — triggers a
 * one-time full page reload to pull the fresh build.
 *
 * A sessionStorage flag guards against an infinite reload loop: if the import
 * still fails right after a reload, the error is re-thrown so the ErrorBoundary
 * can show its fallback instead of reloading forever.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const reloadKey = 'chunk-reload-attempted';
    try {
      const module = await importer();
      // Successful load — clear the guard for future deploys.
      window.sessionStorage.removeItem(reloadKey);
      return module;
    } catch (error) {
      const alreadyReloaded = window.sessionStorage.getItem(reloadKey);
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
        // Return a never-resolving promise so React keeps showing the
        // Suspense fallback while the page reloads.
        return new Promise<{ default: T }>(() => {});
      }
      // Already retried once and still failing — let the ErrorBoundary handle it.
      throw error;
    }
  });
}
