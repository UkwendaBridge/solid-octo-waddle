import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { omcAuth, customerAuth, driverAuth, setToken, removeToken, getToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('maestro_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (identifier: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      let result;

      switch (role) {
        case 'omc':
          result = await omcAuth.login(identifier, password);
          if (result.success && result.data) {
            setToken(result.data.token);
            const userData: User = {
              id: result.data.user.id,
              name: result.data.user.name || 'OMC Admin',
              email: result.data.user.email,
              role: 'omc',
              companyName: result.data.user.company_name,
            };
            setUser(userData);
            sessionStorage.setItem('maestro_user', JSON.stringify(userData));
            setIsLoading(false);
            return true;
          }
          break;

        case 'customer':
          result = await customerAuth.login(identifier, password);
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
            setUser(userData);
            sessionStorage.setItem('maestro_user', JSON.stringify(userData));
            setIsLoading(false);
            return true;
          }
          break;

        case 'driver':
          // Driver uses phone number for login
          result = await driverAuth.login(identifier, password);
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
            setUser(userData);
            sessionStorage.setItem('maestro_user', JSON.stringify(userData));
            setIsLoading(false);
            return true;
          }
          break;
      }

      setError(result?.error || 'Login failed');
      setIsLoading(false);
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    removeToken();
    sessionStorage.removeItem('maestro_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user && !!getToken(), isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
