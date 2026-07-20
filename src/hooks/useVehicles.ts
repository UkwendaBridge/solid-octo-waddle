import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Vehicle } from '../types';
import type { BackendVehicle } from '../types/api';
import { customerVehicles } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapBackendVehicle(v: BackendVehicle): Vehicle {
  return {
    id: v.id,
    regNumber: v.registration_number,
    type: (v.vehicle_type as Vehicle['type']) || 'Other',
    tankCapacity: v.tank_capacity || 0,
    customerId: v.customer_id,
    assignedDriverId: v.driver_id,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVehicles() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const vehiclesQueryKey = ['vehicles', user?.id] as const;
  const isCustomer = isAuthenticated && user?.role === 'customer';

  const toast = () => useToastStore.getState();

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const {
    data: vehicles = [],
    isLoading: isFetchLoading,
    error: queryError,
  } = useQuery({
    queryKey: vehiclesQueryKey,
    queryFn: async () => {
      const r = await customerVehicles.getAll();
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to fetch vehicles');
      return r.data.vehicles.map(mapBackendVehicle);
    },
    enabled: isCustomer,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const addVehicleMutation = useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id'>) => {
      const r = await customerVehicles.create({
        registration_number: vehicle.regNumber,
        vehicle_type: vehicle.type,
        driver_id: vehicle.assignedDriverId,
        tank_capacity: vehicle.tankCapacity,
      });
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to add vehicle');
      return mapBackendVehicle(r.data.vehicle);
    },
    onSuccess: (newVehicle) => {
      qc.setQueryData(vehiclesQueryKey, (prev: Vehicle[] = []) => [...prev, newVehicle]);
      toast().success(`Vehicle "${newVehicle.regNumber}" added`);
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
      const r = await customerVehicles.update(id, {
        registration_number: data.regNumber,
        vehicle_type: data.type,
        driver_id: data.assignedDriverId || undefined,
        tank_capacity: typeof data.tankCapacity === 'number' ? data.tankCapacity : 0,
      });
      if (!r.success) throw new Error(r.error || 'Failed to update vehicle');
      return id;
    },
    onSuccess: (id) => {
      // Re-fetch to get server-confirmed state (server may normalise fields)
      qc.invalidateQueries({ queryKey: vehiclesQueryKey });
      void id; // used above
      toast().success('Vehicle updated');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await customerVehicles.delete(id);
      if (!r.success) throw new Error(r.error || 'Failed to delete vehicle');
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(vehiclesQueryKey, (prev: Vehicle[] = []) => prev.filter((v) => v.id !== id));
      toast().success('Vehicle deleted');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) => {
      const r = await customerVehicles.update(vehicleId, { driver_id: driverId });
      if (!r.success) throw new Error(r.error || 'Failed to assign driver');
      return { vehicleId, driverId };
    },
    onSuccess: ({ vehicleId, driverId }) => {
      qc.setQueryData(vehiclesQueryKey, (prev: Vehicle[] = []) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, assignedDriverId: driverId } : v)),
      );
      toast().success('Driver assigned to vehicle');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const unassignVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const r = await customerVehicles.update(vehicleId, { driver_id: '' });
      if (!r.success) throw new Error(r.error || 'Failed to unassign vehicle');
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      qc.setQueryData(vehiclesQueryKey, (prev: Vehicle[] = []) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, assignedDriverId: undefined } : v)),
      );
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const anyMutating =
    addVehicleMutation.isPending ||
    updateVehicleMutation.isPending ||
    deleteVehicleMutation.isPending ||
    assignDriverMutation.isPending ||
    unassignVehicleMutation.isPending;

  // ── Public API (identical shape to old VehicleContextType) ────────────────────
  return {
    vehicles,
    isLoading: isFetchLoading || anyMutating,
    error: queryError ? queryError.message : null,

    fetchVehicles: () =>
      qc.invalidateQueries({ queryKey: vehiclesQueryKey }).then(() => undefined as void),

    addVehicle: async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle | null> => {
      try {
        return await addVehicleMutation.mutateAsync(vehicle);
      } catch {
        return null;
      }
    },

    updateVehicle: async (id: string, data: Partial<Vehicle>): Promise<boolean> => {
      try {
        await updateVehicleMutation.mutateAsync({ id, data });
        return true;
      } catch {
        return false;
      }
    },

    deleteVehicle: async (id: string): Promise<boolean> => {
      try {
        await deleteVehicleMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },

    assignVehicleToDriver: async (vehicleId: string, driverId: string): Promise<boolean> => {
      try {
        await assignDriverMutation.mutateAsync({ vehicleId, driverId });
        return true;
      } catch {
        return false;
      }
    },

    unassignVehicle: async (vehicleId: string): Promise<boolean> => {
      try {
        await unassignVehicleMutation.mutateAsync(vehicleId);
        return true;
      } catch {
        return false;
      }
    },

    getVehiclesByCustomer: (customerId: string) => vehicles.filter((v) => v.customerId === customerId),
    getVehiclesByDriver: (driverId: string) => vehicles.filter((v) => v.assignedDriverId === driverId),
  };
}
