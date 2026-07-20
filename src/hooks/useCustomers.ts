import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '../types';
import type { BackendCustomerProfile } from '../types/api';
import { omcCustomers } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapBackendCustomer(c: BackendCustomerProfile): Customer {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || '',
    companyName: c.company_name || c.name,
    createdAt: c.created_at || new Date().toISOString(),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCustomers() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const qc = useQueryClient();

  const customersQueryKey = ['customers', user?.id] as const;
  const isOmc = isAuthenticated && user?.role === 'omc';

  const toast = () => useToastStore.getState();

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const {
    data: customers = [],
    isLoading: isFetchLoading,
    error: queryError,
  } = useQuery({
    queryKey: customersQueryKey,
    queryFn: async () => {
      const r = await omcCustomers.getAll();
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to fetch customers');
      return r.data.customers.map(mapBackendCustomer);
    },
    enabled: isOmc,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'createdAt'> & { password: string }) => {
      const r = await omcCustomers.register({
        email: customer.email,
        password: customer.password,
        name: customer.name,
        phone: customer.phone,
      });
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to add customer');
      const newCustomer: Customer = {
        id: r.data.customer.id,
        name: r.data.customer.name,
        email: r.data.customer.email,
        phone: r.data.customer.phone || '',
        companyName: customer.companyName,
        createdAt: new Date().toISOString(),
      };
      return newCustomer;
    },
    onSuccess: (newCustomer: Customer) => {
      qc.setQueryData(customersQueryKey, (prev: Customer[] = []) => [...prev, newCustomer]);
      toast().success(`Customer "${newCustomer.name}" created`);
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const r = await omcCustomers.update(id, { name: data.name, phone: data.phone });
      if (!r.success) throw new Error(r.error || 'Failed to update customer');
      return { id, data };
    },
    onSuccess: ({ id, data }) => {
      qc.setQueryData(customersQueryKey, (prev: Customer[] = []) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
      );
      toast().success('Customer updated');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await omcCustomers.delete(id);
      if (!r.success) throw new Error(r.error || 'Failed to delete customer');
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(customersQueryKey, (prev: Customer[] = []) => prev.filter((c) => c.id !== id));
      toast().success('Customer deleted');
    },
    onError: (err: Error) => toast().error(err.message),
  });

  const anyMutating =
    addCustomerMutation.isPending ||
    updateCustomerMutation.isPending ||
    deleteCustomerMutation.isPending;

  // ── Public API (identical shape to old CustomerContextType) ───────────────────
  return {
    customers,
    isLoading: isFetchLoading || anyMutating,
    error: queryError ? queryError.message : null,

    fetchCustomers: () =>
      qc.invalidateQueries({ queryKey: customersQueryKey }).then(() => undefined as void),

    addCustomer: async (
      customer: Omit<Customer, 'id' | 'createdAt'> & { password: string },
    ): Promise<Customer | null> => {
      // Client-side validation (matches original behaviour)
      if (!customer.name?.trim()) {
        toast().error('Customer name is required');
        return null;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!customer.email?.trim() || !emailRegex.test(customer.email)) {
        toast().error('Please enter a valid email address');
        return null;
      }
      if (!customer.password || customer.password.length < 6) {
        toast().error('Password must be at least 6 characters');
        return null;
      }
      try {
        return await addCustomerMutation.mutateAsync(customer);
      } catch {
        return null;
      }
    },

    updateCustomer: async (id: string, data: Partial<Customer>): Promise<boolean> => {
      try {
        await updateCustomerMutation.mutateAsync({ id, data });
        return true;
      } catch {
        return false;
      }
    },

    deleteCustomer: async (id: string): Promise<boolean> => {
      try {
        await deleteCustomerMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
  };
}
