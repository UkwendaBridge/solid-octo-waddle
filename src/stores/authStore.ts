import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { omcAuth, customerAuth, driverAuth, setToken, removeToken, getToken } from '../services/api';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

// Restore session from sessionStorage on first load (clears on app close for security)
const storedUser = (() => {
  try {
    const raw = sessionStorage.getItem('maestro_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create<AuthState>()((set) => ({
  user: storedUser,
  isAuthenticated: !!storedUser && !!getToken(),
  isLoading: false,
  error: null,

  login: async (identifier, password, role) => {
    set({ isLoading: true, error: null });

    try {
      switch (role) {
        case 'omc': {
          const result = await omcAuth.login(identifier, password);
          if (result.success && result.data) {
            setToken(result.data.token);
            const userData: User = {
              id: result.data.user.id,
              name: result.data.user.name || 'OMC Admin',
              email: result.data.user.email,
              role: 'omc',
              companyName: result.data.user.company_name,
            };
            sessionStorage.setItem('maestro_user', JSON.stringify(userData));
            set({ user: userData, isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ error: result.error || 'Login failed', isLoading: false });
          return false;
        }

        case 'customer': {
          const result = await customerAuth.login(identifier, password);
          if (result.success && result.data) {
            setToken(result.data.token);
            const userData: User = {
              id: result.data.customer.id,
              name: result.data.customer.name,
              email: result.data.customer.email,
              role: 'customer',
              phone: result.data.customer.phone,
              companyName: result.data.customer.company_name,
            };
            sessionStorage.setItem('maestro_user', JSON.stringify(userData));
            set({ user: userData, isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ error: result.error || 'Login failed', isLoading: false });
          return false;
        }

        case 'driver': {
          const result = await driverAuth.login(identifier, password);
          if (result.success && result.data) {
            setToken(result.data.token);
            const userData: User = {
              id: result.data.driver.id,
              name: result.data.driver.name,
              email: result.data.driver.email || '',
              role: 'driver',
              phone: result.data.driver.phone,
              customerId: result.data.driver.customer_id,
            };
            sessionStorage.setItem('maestro_user', JSON.stringify(userData));
            set({ user: userData, isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ error: result.error || 'Login failed', isLoading: false });
          return false;
        }

        default:
          set({ error: 'Unknown role', isLoading: false });
          return false;
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Login failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    removeToken();
    sessionStorage.removeItem('maestro_user');
    queryClient.clear();
    set({ user: null, isAuthenticated: false, error: null });
  },
}));

// Named export matching the old hook name so context/AuthContext re-exports work
export const useAuth = useAuthStore;
