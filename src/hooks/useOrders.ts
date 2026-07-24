import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FuelOrder, NewOrderFormData, OrderStatus, Site } from '../types';
import type { BackendOrder } from '../types/api';
import { customerOrders, omcOrders, driverOtp } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

// ─── Static data ──────────────────────────────────────────────────────────────

const DEMO_SITES: Site[] = [
  { id: 'SITE-JHB-001', name: 'Maestro Fuel Depot — Johannesburg', address: '45 Main Reef Rd, Johannesburg' },
  { id: 'SITE-CPT-002', name: 'Maestro Fuel Depot — Cape Town', address: '12 Waterfront Dr, Cape Town' },
  { id: 'SITE-DBN-003', name: 'Maestro Fuel Depot — Durban', address: '88 Point Rd, Durban' },
];

// ─── Mapper ───────────────────────────────────────────────────────────────────

/**
 * Allocated / drawn / remaining litres.
 *
 * `remaining_fuel` and `litres_drawn` were added to the ordering backend so a
 * partially-filled order stops reading as if it were untouched. Older backends
 * omit them, so fall back to the full allocation with nothing drawn — the same
 * behaviour the portal had before.
 */
export function mapVolumes(o: BackendOrder) {
  const allocated = parseFloat(String(o.requested_fuel)) || 0;
  const drawn = o.litres_drawn != null ? parseFloat(String(o.litres_drawn)) || 0 : 0;
  const remaining =
    o.remaining_fuel != null
      ? parseFloat(String(o.remaining_fuel)) || 0
      : Math.max(0, allocated - drawn);
  return {
    fuelVolumeAllocated: allocated,
    fuelVolumeDrawn: drawn,
    fuelVolumeRemaining: remaining,
  };
}

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

// ─── Query function (role-aware) ──────────────────────────────────────────────

async function fetchAllOrders(role: string): Promise<FuelOrder[]> {
  switch (role) {
    case 'omc': {
      const r = await omcOrders.getAll();
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to fetch orders');
      return r.data.orders.map(mapBackendOrder);
    }
    case 'customer': {
      const r = await customerOrders.getAll();
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to fetch orders');
      return r.data.orders.map(mapBackendOrder);
    }
    case 'driver': {
      const r = await driverOtp.getOrders();
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to fetch orders');
      return (r.data.orders || []).map(mapBackendOrder);
    }
    default:
      return [];
  }
}

// ─── Update payload type (matches original context) ───────────────────────────

type OrderUpdatePayload = {
  driver_id?: string;
  vehicle_id?: string;
  requested_fuel?: number;
  fuel_grade?: string;
  attendantId?: string;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrders() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const ordersQueryKey = ['orders', user?.id, user?.role] as const;

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const {
    data: orders = [],
    isLoading: isFetchLoading,
    error: queryError,
  } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: () => fetchAllOrders(user!.role),
    enabled: isAuthenticated && !!user,
  });

  // ── Helpers (toast outside render) ───────────────────────────────────────────
  const toast = () => useToastStore.getState();

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const placeOrderMutation = useMutation({
    mutationFn: async (data: NewOrderFormData & { attendantId?: string }) => {
      const r = await customerOrders.create({
        driver_id: data.driverId,
        vehicle_id: data.vehicleId,
        requested_fuel: data.fuelVolumeAllocated,
        fuel_grade: data.fuelType.toLowerCase() as 'petrol' | 'diesel',
        attendant_id: data.attendantId || undefined,
      });
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to create order');
      return mapBackendOrder(r.data.order);
    },
    onSuccess: (newOrder) => {
      qc.setQueryData(ordersQueryKey, (prev: FuelOrder[] = []) => [newOrder, ...prev]);
      toast().success('Order placed successfully');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: OrderUpdatePayload & { attendantId?: string } }) => {
      const r = await customerOrders.update(orderId, {
        ...data,
        attendant_id: data.attendantId || undefined,
      });
      if (!r.success) throw new Error(r.error || 'Failed to update order');
      return { orderId, data };
    },
    onSuccess: ({ orderId, data }) => {
      qc.setQueryData(ordersQueryKey, (prev: FuelOrder[] = []) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                ...(data.driver_id !== undefined && { driverId: data.driver_id }),
                ...(data.vehicle_id !== undefined && { vehicleId: data.vehicle_id }),
                ...(data.requested_fuel !== undefined && { fuelVolumeAllocated: data.requested_fuel }),
                ...(data.fuel_grade !== undefined && {
                  fuelType: data.fuel_grade === 'diesel' ? 'Diesel' : ('Petrol' as const),
                }),
                ...(data.attendantId !== undefined && { attendantId: data.attendantId }),
              }
            : o,
        ),
      );
      toast().success('Order updated successfully');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const sendOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const r = await customerOrders.send(orderId);
      if (!r.success) throw new Error(r.error || 'Failed to send order');
      return orderId;
    },
    onSuccess: (orderId) => {
      qc.setQueryData(ordersQueryKey, (prev: FuelOrder[] = []) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'pending' as OrderStatus } : o)),
      );
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const approveOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const r = await omcOrders.approve(orderId);
      if (!r.success) throw new Error(r.error || 'Failed to approve order');
      return orderId;
    },
    onSuccess: (orderId) => {
      qc.setQueryData(ordersQueryKey, (prev: FuelOrder[] = []) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'approved' as OrderStatus, approvedAt: new Date().toISOString(), approvedBy: user?.id }
            : o,
        ),
      );
      toast().success('Order approved successfully');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const rejectOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const r = await omcOrders.reject(orderId, reason);
      if (!r.success) throw new Error(r.error || 'Failed to reject order');
      return { orderId, reason };
    },
    onSuccess: ({ orderId, reason }) => {
      qc.setQueryData(ordersQueryKey, (prev: FuelOrder[] = []) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'rejected' as OrderStatus, otpActive: false, rejectionReason: reason }
            : o,
        ),
      );
      toast().success('Order rejected successfully');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const r = await driverOtp.complete(orderId);
      if (!r.success) throw new Error(r.error || 'Failed to complete order');
      return orderId;
    },
    onSuccess: (orderId) => {
      qc.setQueryData(ordersQueryKey, (prev: FuelOrder[] = []) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'completed' as OrderStatus, otpActive: false, completedAt: new Date().toISOString() }
            : o,
        ),
      );
      toast().success('Order completed successfully');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const generateOtpMutation = useMutation({
    mutationFn: async ({ orderId, resendSms }: { orderId: string; resendSms: boolean }) => {
      const r = await driverOtp.requestOtp(orderId, resendSms);
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to generate OTP');
      return { orderId, otp: r.data.otp, expiresAt: r.data.expires_at };
    },
    onSuccess: ({ orderId, otp }) => {
      qc.setQueryData(ordersQueryKey, (prev: FuelOrder[] = []) =>
        prev.map((o) => (o.id === orderId ? { ...o, otp, otpActive: true } : o)),
      );
    },
    onError: (err: Error) => toast().error(err.message),
  });

  // ── Combined loading (initial fetch OR any mutation in flight) ────────────────
  const anyMutating =
    placeOrderMutation.isPending ||
    updateOrderMutation.isPending ||
    sendOrderMutation.isPending ||
    approveOrderMutation.isPending ||
    rejectOrderMutation.isPending ||
    completeOrderMutation.isPending ||
    generateOtpMutation.isPending;

  // ── Public API (identical shape to old OrderContextType) ──────────────────────
  return {
    orders,
    sites: DEMO_SITES,
    isLoading: isFetchLoading || anyMutating,
    error: queryError ? queryError.message : null,

    fetchOrders: () =>
      qc.invalidateQueries({ queryKey: ordersQueryKey }).then(() => undefined as void),

    placeOrder: async (data: NewOrderFormData): Promise<FuelOrder | null> => {
      try {
        return await placeOrderMutation.mutateAsync(data);
      } catch {
        return null;
      }
    },

    updateOrder: async (orderId: string, data: OrderUpdatePayload): Promise<boolean> => {
      try {
        await updateOrderMutation.mutateAsync({ orderId, data });
        return true;
      } catch {
        return false;
      }
    },

    sendOrder: async (orderId: string): Promise<boolean> => {
      try {
        await sendOrderMutation.mutateAsync(orderId);
        return true;
      } catch {
        return false;
      }
    },

    approveOrder: async (orderId: string): Promise<boolean> => {
      try {
        await approveOrderMutation.mutateAsync(orderId);
        return true;
      } catch {
        return false;
      }
    },

    rejectOrder: async (orderId: string, reason: string): Promise<boolean> => {
      try {
        await rejectOrderMutation.mutateAsync({ orderId, reason });
        return true;
      } catch {
        return false;
      }
    },

    completeOrder: async (orderId: string): Promise<boolean> => {
      try {
        await completeOrderMutation.mutateAsync(orderId);
        return true;
      } catch {
        return false;
      }
    },

    generateOtpForOrder: async (
      orderId: string,
      resendSms = false,
    ): Promise<{ otp: string; expiresAt: string } | null> => {
      try {
        const { otp, expiresAt } = await generateOtpMutation.mutateAsync({ orderId, resendSms });
        return { otp, expiresAt };
      } catch {
        return null;
      }
    },

    validateOtp: (otp: string): FuelOrder | null =>
      orders.find((o) => o.otp === otp && o.otpActive && o.status === 'approved') ?? null,

    getOrdersByCustomer: (customerId: string) => orders.filter((o) => o.customerId === customerId),
    getOrdersByDriver: (driverId: string) => orders.filter((o) => o.driverId === driverId),
    getOrdersByStatus: (status: OrderStatus) => orders.filter((o) => o.status === status),
  };
}
