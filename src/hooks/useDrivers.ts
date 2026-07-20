import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Driver } from '../types';
import type { BackendDriverProfile } from '../types/api';
import { customerDrivers } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapBackendDriver(d: BackendDriverProfile): Driver {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email,
    customerId: d.customer_id || '',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDrivers() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const driversQueryKey = ['drivers', user?.id] as const;
  const isCustomer = isAuthenticated && user?.role === 'customer';

  const toast = () => useToastStore.getState();

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const {
    data: drivers = [],
    isLoading: isFetchLoading,
    error: queryError,
  } = useQuery({
    queryKey: driversQueryKey,
    queryFn: async () => {
      const r = await customerDrivers.getAll();
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to fetch drivers');
      return r.data.drivers.map(mapBackendDriver);
    },
    enabled: isCustomer,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const addDriverMutation = useMutation({
    mutationFn: async (driver: Omit<Driver, 'id'> & { password: string }) => {
      const r = await customerDrivers.create({
        name: driver.name,
        phone: driver.phone,
        password: driver.password,
        email: driver.email,
        nrc: driver.nrc,
        nationality: driver.nationality,
      });
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to add driver');
      return mapBackendDriver(r.data.driver);
    },
    onSuccess: (newDriver) => {
      qc.setQueryData(driversQueryKey, (prev: Driver[] = []) => [...prev, newDriver]);
      toast().success(`Driver "${newDriver.name}" added`);
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Driver> }) => {
      const r = await customerDrivers.update(id, {
        name: data.name,
        phone: data.phone,
        email: data.email,
      });
      if (!r.success) throw new Error(r.error || 'Failed to update driver');
      return { id, data };
    },
    onSuccess: ({ id, data }) => {
      qc.setQueryData(driversQueryKey, (prev: Driver[] = []) =>
        prev.map((d) => (d.id === id ? { ...d, ...data } : d)),
      );
      toast().success('Driver updated');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await customerDrivers.delete(id);
      if (!r.success) throw new Error(r.error || 'Failed to delete driver');
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(driversQueryKey, (prev: Driver[] = []) => prev.filter((d) => d.id !== id));
      toast().success('Driver deleted');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const anyMutating =
    addDriverMutation.isPending ||
    updateDriverMutation.isPending ||
    deleteDriverMutation.isPending;

  // ── Public API (identical shape to old DriverContextType) ─────────────────────
  return {
    drivers,
    isLoading: isFetchLoading || anyMutating,
    error: queryError ? queryError.message : null,

    fetchDrivers: () =>
      qc.invalidateQueries({ queryKey: driversQueryKey }).then(() => undefined as void),

    addDriver: async (driver: Omit<Driver, 'id'> & { password: string }): Promise<Driver | null> => {
      // Client-side validation (matches original behaviour)
      if (!driver.name?.trim()) {
        toast().error('Driver name is required');
        return null;
      }
      const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
      if (!driver.phone?.trim() || !phoneRegex.test(driver.phone)) {
        toast().error('Please enter a valid phone number (at least 10 digits)');
        return null;
      }
      if (!driver.password || driver.password.length < 6) {
        toast().error('Password must be at least 6 characters');
        return null;
      }
      try {
        return await addDriverMutation.mutateAsync(driver);
      } catch {
        return null;
      }
    },

    updateDriver: async (id: string, data: Partial<Driver>): Promise<boolean> => {
      try {
        await updateDriverMutation.mutateAsync({ id, data });
        return true;
      } catch {
        return false;
      }
    },

    deleteDriver: async (id: string): Promise<boolean> => {
      try {
        await deleteDriverMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },

    getDriversByCustomer: (customerId: string) => drivers.filter((d) => d.customerId === customerId),
  };
}
