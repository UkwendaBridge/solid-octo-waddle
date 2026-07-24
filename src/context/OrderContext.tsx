import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { FuelOrder, NewOrderFormData, OrderStatus, Site } from '../types';
import type { BackendOrder } from '../types/api';
import { customerOrders, omcOrders, driverOtp } from '../services/api';
import { mapVolumes } from '../hooks/useOrders';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface OrderContextType {
  orders: FuelOrder[];
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  placeOrder: (data: NewOrderFormData) => Promise<FuelOrder | null>;
  updateOrder: (orderId: string, data: { driver_id?: string; vehicle_id?: string; requested_fuel?: number; fuel_grade?: string }) => Promise<boolean>;
  sendOrder: (orderId: string) => Promise<boolean>;
  approveOrder: (orderId: string) => Promise<boolean>;
  rejectOrder: (orderId: string, reason: string) => Promise<boolean>;
  completeOrder: (orderId: string) => void;
  generateOtpForOrder: (orderId: string, resendSms?: boolean) => Promise<{ otp: string; expiresAt: string } | null>;
  validateOtp: (otp: string) => FuelOrder | null;
  getOrdersByCustomer: (customerId: string) => FuelOrder[];
  getOrdersByDriver: (driverId: string) => FuelOrder[];
  getOrdersByStatus: (status: OrderStatus) => FuelOrder[];
}

const OrderContext = createContext<OrderContextType | null>(null);

// Demo sites (these could also come from API in future)
const DEMO_SITES: Site[] = [
  { id: 'SITE-JHB-001', name: 'Maestro Fuel Depot — Johannesburg', address: '45 Main Reef Rd, Johannesburg' },
  { id: 'SITE-CPT-002', name: 'Maestro Fuel Depot — Cape Town', address: '12 Waterfront Dr, Cape Town' },
  { id: 'SITE-DBN-003', name: 'Maestro Fuel Depot — Durban', address: '88 Point Rd, Durban' },
];

function mapBackendOrder(o: BackendOrder): FuelOrder {
  return {
    id: o.id,
    customerId: o.customer_id,
    customerName: o.customer_name || '',
    siteId: o.site_id || '',
    driverId: o.driver_id,
    driverName: o.driver_name || '',
    driverPhone: o.driver_phone || '',
    vehicleId: o.vehicle_id,
    vehicleRegNumber: o.registration_number || o.vehicle_registration || '',
    vehicleType: o.vehicle_type || 'Other',
    tankCapacity: o.tank_capacity || 0,
    // Shared with useOrders so the two mappers cannot drift apart.
    ...mapVolumes(o),
    fuelType: o.fuel_grade === 'diesel' ? 'Diesel' : 'Petrol',
    otp: o.otp_code,
    otpActive: !!o.otp_code && o.status === 'approved',
    status: o.status as OrderStatus,
    createdAt: o.created_at,
    approvedAt: o.approved_at,
    approvedBy: o.approved_by,
    rejectionReason: o.rejection_reason,
    completedAt: o.completed_at,
  };
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<FuelOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      let result;

      switch (user.role) {
        case 'omc':
          result = await omcOrders.getAll();
          break;
        case 'customer':
          result = await customerOrders.getAll();
          break;
        case 'driver':
          result = await driverOtp.getOrders();
          if (result?.success && result.data) {
            setOrders((result.data.orders || []).map(mapBackendOrder));
          } else {
            setError(result?.error || 'Failed to fetch orders');
          }
          setIsLoading(false);
          return;
        default:
          setIsLoading(false);
          return;
      }

      if (result?.success && result.data) {
        setOrders(result.data.orders.map(mapBackendOrder));
      } else {
        setError(result?.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Auto-fetch on login
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user, fetchOrders]);

  const placeOrder = useCallback(async (data: NewOrderFormData): Promise<FuelOrder | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerOrders.create({
        driver_id: data.driverId,
        vehicle_id: data.vehicleId,
        requested_fuel: data.fuelVolumeAllocated,
        fuel_grade: data.fuelType.toLowerCase() as 'petrol' | 'diesel',
        destination: data.destination?.trim() || undefined,
      });

      if (result.success && result.data) {
        const newOrder = mapBackendOrder(result.data.order);
        setOrders(prev => [newOrder, ...prev]);
        toast.success(`Order placed successfully`);
        return newOrder;
      } else {
        const msg = result.error || 'Failed to create order';
        setError(msg);
        toast.error(msg);
        return null;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create order';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOrder = useCallback(async (orderId: string, data: { driver_id?: string; vehicle_id?: string; requested_fuel?: number; fuel_grade?: string }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerOrders.update(orderId, data);

      if (result.success) {
        await fetchOrders();
        return true;
      } else {
        setError(result.error || 'Failed to update order');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrders]);

  const sendOrder = useCallback(async (orderId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customerOrders.send(orderId);

      if (result.success) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: 'pending' as OrderStatus } : o
        ));
        return true;
      } else {
        setError(result.error || 'Failed to send order');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveOrder = useCallback(async (orderId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await omcOrders.approve(orderId);

      if (result.success) {
        setOrders(prev => prev.map(o =>
          o.id === orderId
            ? { ...o, status: 'approved' as OrderStatus, approvedAt: new Date().toISOString(), approvedBy: user?.id }
            : o,
        ));
        toast.success('Order approved successfully');
        return true;
      } else {
        const msg = result.error || 'Failed to approve order';
        setError(msg);
        toast.error(msg);
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve order';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const rejectOrder = useCallback(async (orderId: string, reason: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await omcOrders.reject(orderId, reason);

      if (result.success) {
        setOrders(prev => prev.map(o =>
          o.id === orderId
            ? { ...o, status: 'rejected' as OrderStatus, otpActive: false, rejectionReason: reason }
            : o,
        ));
        toast.success('Order rejected successfully');
        return true;
      } else {
        const msg = result.error || 'Failed to reject order';
        setError(msg);
        toast.error(msg);
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject order';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeOrder = useCallback((orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: 'completed' as OrderStatus, otpActive: false, completedAt: new Date().toISOString() }
          : o,
      ),
    );
  }, []);

  const generateOtpForOrder = useCallback(async (orderId: string, resendSms: boolean = false): Promise<{ otp: string; expiresAt: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await driverOtp.requestOtp(orderId, resendSms);

      if (result.success && result.data) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, otp: result.data!.otp, otpActive: true } : o
        ));
        return { otp: result.data.otp, expiresAt: result.data.expires_at };
      } else {
        setError(result.error || 'Failed to generate OTP');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate OTP');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOrdersByCustomer = useCallback(
    (customerId: string) => orders.filter(o => o.customerId === customerId),
    [orders],
  );

  const getOrdersByDriver = useCallback(
    (driverId: string) => orders.filter(o => o.driverId === driverId),
    [orders],
  );

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => orders.filter(o => o.status === status),
    [orders],
  );

  const validateOtp = useCallback(
    (otp: string): FuelOrder | null => {
      return orders.find(o => o.otp === otp && o.otpActive && o.status === 'approved') ?? null;
    },
    [orders],
  );

  return (
    <OrderContext.Provider
      value={{
        orders,
        sites: DEMO_SITES,
        isLoading,
        error,
        fetchOrders,
        placeOrder,
        updateOrder,
        sendOrder,
        approveOrder,
        rejectOrder,
        completeOrder,
        generateOtpForOrder,
        validateOtp,
        getOrdersByCustomer,
        getOrdersByDriver,
        getOrdersByStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders(): OrderContextType {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
