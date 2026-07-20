import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Vehicle } from '../types';
import type { BackendVehicle } from '../types/api';
import { customerVehicles } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface VehicleContextType {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  fetchVehicles: () => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle | null>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<boolean>;
  deleteVehicle: (id: string) => Promise<boolean>;
  assignVehicleToDriver: (vehicleId: string, driverId: string) => Promise<boolean>;
  unassignVehicle: (vehicleId: string) => Promise<boolean>;
  getVehiclesByCustomer: (customerId: string) => Vehicle[];
  getVehiclesByDriver: (driverId: string) => Vehicle[];
}

const VehicleContext = createContext<VehicleContextType | null>(null);

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

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const fetchVehicles = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'customer') return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await customerVehicles.getAll();
      if (result.success && result.data) {
        setVehicles(result.data.vehicles.map(mapBackendVehicle));
      } else {
        setError(result.error || 'Failed to fetch vehicles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  // Fetch vehicles when customer logs in
  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      fetchVehicles();
    }
  }, [isAuthenticated, user?.role, fetchVehicles]);

  const addVehicle = useCallback(async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerVehicles.create({
        registration_number: vehicle.regNumber,
        vehicle_type: vehicle.type,
        driver_id: vehicle.assignedDriverId,
        tank_capacity: vehicle.tankCapacity,
      });

      if (result.success && result.data) {
        const newVehicle = mapBackendVehicle(result.data.vehicle);
        setVehicles(prev => [...prev, newVehicle]);
        toast.success(`Vehicle "${newVehicle.regNumber}" added`);
        return newVehicle;
      } else {
        setError(result.error || 'Failed to add vehicle');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vehicle');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatePayload = {
        registration_number: data.regNumber,
        vehicle_type: data.type,
        driver_id: data.assignedDriverId || undefined,
        tank_capacity: typeof data.tankCapacity === 'number' ? data.tankCapacity : 0,
      };

      const result = await customerVehicles.update(id, updatePayload);

      if (result.success) {
        // Re-fetch vehicles to get updated data from server
        await fetchVehicles();
        toast.success('Vehicle updated');
        return true;
      } else {
        setError(result.error || 'Failed to update vehicle');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchVehicles]);

  const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerVehicles.delete(id);

      if (result.success) {
        setVehicles(prev => prev.filter(v => v.id !== id));
        toast.success('Vehicle deleted');
        return true;
      } else {
        setError(result.error || 'Failed to delete vehicle');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assignVehicleToDriver = useCallback(async (vehicleId: string, driverId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerVehicles.update(vehicleId, { driver_id: driverId });

      if (result.success) {
        setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, assignedDriverId: driverId } : v));
        toast.success('Driver assigned to vehicle');
        return true;
      } else {
        setError(result.error || 'Failed to assign driver');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign driver');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unassignVehicle = useCallback(async (vehicleId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerVehicles.update(vehicleId, { driver_id: '' });

      if (result.success) {
        setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, assignedDriverId: undefined } : v));
        return true;
      } else {
        setError(result.error || 'Failed to unassign vehicle');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign vehicle');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getVehiclesByCustomer = useCallback(
    (customerId: string) => vehicles.filter(v => v.customerId === customerId),
    [vehicles],
  );

  const getVehiclesByDriver = useCallback(
    (driverId: string) => vehicles.filter(v => v.assignedDriverId === driverId),
    [vehicles],
  );

  return (
    <VehicleContext.Provider value={{
      vehicles,
      isLoading,
      error,
      fetchVehicles,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      assignVehicleToDriver,
      unassignVehicle,
      getVehiclesByCustomer,
      getVehiclesByDriver,
    }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicles must be used within VehicleProvider');
  return ctx;
}
