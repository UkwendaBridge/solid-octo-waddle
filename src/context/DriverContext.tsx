import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Driver } from '../types';
import type { BackendDriverProfile } from '../types/api';
import { customerDrivers } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface DriverContextType {
  drivers: Driver[];
  isLoading: boolean;
  error: string | null;
  fetchDrivers: () => Promise<void>;
  addDriver: (driver: Omit<Driver, 'id'> & { password: string }) => Promise<Driver | null>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<boolean>;
  deleteDriver: (id: string) => Promise<boolean>;
  getDriversByCustomer: (customerId: string) => Driver[];
}

const DriverContext = createContext<DriverContextType | null>(null);

function mapBackendDriver(d: BackendDriverProfile): Driver {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email,
    customerId: d.customer_id || '',
  };
}

export function DriverProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const fetchDrivers = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'customer') return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await customerDrivers.getAll();
      if (result.success && result.data) {
        setDrivers(result.data.drivers.map(mapBackendDriver));
      } else {
        setError(result.error || 'Failed to fetch drivers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  // Fetch drivers when customer logs in
  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      fetchDrivers();
    }
  }, [isAuthenticated, user?.role, fetchDrivers]);

  const addDriver = useCallback(async (driver: Omit<Driver, 'id'> & { password: string }): Promise<Driver | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerDrivers.create({
        name: driver.name,
        phone: driver.phone,
        password: driver.password,
        email: driver.email,
        nrc: driver.nrc,
        nationality: driver.nationality,
      });

      if (result.success && result.data) {
        const newDriver = mapBackendDriver(result.data.driver);
        setDrivers(prev => [...prev, newDriver]);
        toast.success(`Driver "${newDriver.name}" added`);
        return newDriver;
      } else {
        setError(result.error || 'Failed to add driver');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add driver');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDriver = useCallback(async (id: string, data: Partial<Driver>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerDrivers.update(id, {
        name: data.name,
        phone: data.phone,
        email: data.email,
      });

      if (result.success) {
        setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
        toast.success('Driver updated');
        return true;
      } else {
        setError(result.error || 'Failed to update driver');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update driver');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDriver = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerDrivers.delete(id);

      if (result.success) {
        setDrivers(prev => prev.filter(d => d.id !== id));
        toast.success('Driver deleted');
        return true;
      } else {
        setError(result.error || 'Failed to delete driver');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete driver');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDriversByCustomer = useCallback(
    (customerId: string) => drivers.filter(d => d.customerId === customerId),
    [drivers],
  );

  return (
    <DriverContext.Provider value={{
      drivers,
      isLoading,
      error,
      fetchDrivers,
      addDriver,
      updateDriver,
      deleteDriver,
      getDriversByCustomer
    }}>
      {children}
    </DriverContext.Provider>
  );
}

export function useDrivers() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDrivers must be used within DriverProvider');
  return ctx;
}
