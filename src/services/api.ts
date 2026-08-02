// =============================================
// OMC DEBTOR MANAGEMENT (Scaffold)
// =============================================

interface Debtor {
  id: number;
  name: string;
  contact: string;
  amount: number;
}

export const omcDebtors = {
  getAll: async (): Promise<{ success: boolean; data?: Debtor[]; error?: string }> => {
    // TODO: Replace with real API call
    // return apiRequest<DebtorsListResponse>('/omc/debtors', { method: 'GET' });
    return {
      success: true,
      data: [
        { id: 1, name: 'John Doe', contact: 'john@example.com', amount: 500 },
        { id: 2, name: 'Jane Smith', contact: 'jane@example.com', amount: 300 },
      ],
    };
  },
  add: async (
    debtor: { name: string; contact: string; amount: number },
  ): Promise<{ success: boolean; data?: Debtor; error?: string }> => {
    // TODO: Replace with real API call
    // return apiRequest<DebtorDetailResponse>('/omc/debtors', { method: 'POST', body: JSON.stringify(debtor) });
    return { success: true, data: { ...debtor, id: Math.floor(Math.random() * 10000) } };
  },
};
import type {
  OmcLoginResponse,
  CustomerLoginResponse,
  DriverLoginResponse,
  CustomersListResponse,
  CustomerDetailResponse,
  DriversListResponse,
  DriverDetailResponse,
  VehiclesListResponse,
  VehicleDetailResponse,
  OrdersListResponse,
  OrderCreateResponse,
  BulkOrderInput,
  BulkOrderCreateResponse,
  BulkOrderRowError,
  OtpRequestResponse,
  OrderDetailResponse,
  StationVerifyResponse,
  StationCheckOrderResponse,
  MessageResponse,
  CustomerProfileResponse,
  DriverProfileResponse,
  CustomerBalanceResponse,
  BalanceHistoryResponse,
  OmcCustomerBalanceResponse,
  OmcBalancesListResponse,
  BalanceUpdateResponse,
} from '../types/api';

// API Configuration and Base Functions
const RAW_API_URL = (import.meta.env.VITE_API_URL || 'https://symmetrical-winner-zawt.onrender.com').trim();

/**
 * Turn whatever the deploy environment supplied into an absolute origin.
 *
 * A VITE_API_URL that isn't a valid absolute URL makes every fetch RELATIVE, so
 * requests silently go to our own origin — the SPA rewrite answers with index.html
 * or a 405, and the app reports it as a login failure. Two typos cause this and both
 * are repaired here rather than trusting the dashboard to be exact:
 *
 *   "host.example.com"              -> missing scheme entirely
 *   "https//host.example.com"       -> missing the colon (not absolute, so still relative)
 *   "https:/host.example.com"       -> only one slash
 *   "https://https//host.example.com" -> scheme pasted on top of a scheme; absolute, but
 *                                        the host is literally "https" (ERR_NAME_NOT_RESOLVED)
 */
function normalizeBaseUrl(value: string): string {
  let rest = value.replace(/\/+$/, '');
  let scheme = 'https';
  let sawScheme = false;

  // Strip every leading scheme-like prefix, keeping the first one. The pattern needs a
  // slash after the optional colon, so a hostname such as "httpbin.org" is left alone.
  for (;;) {
    const match = rest.match(/^(https?):?\/{1,2}/i);
    if (!match) break;
    if (!sawScheme) {
      scheme = match[1].toLowerCase();
      sawScheme = true;
    }
    rest = rest.slice(match[0].length);
  }

  return `${scheme}://${rest}`;
}

export const API_BASE_URL = normalizeBaseUrl(RAW_API_URL);

// Loud in production too: a wrong API URL breaks every request, and the symptom
// ("Invalid credentials") points nowhere near the cause.
if (API_BASE_URL !== RAW_API_URL.replace(/\/+$/, '')) {
  console.warn(`[api] VITE_API_URL "${RAW_API_URL}" is not an absolute URL; using "${API_BASE_URL}"`);
}

// Token management
export const getToken = (): string | null => {
  return sessionStorage.getItem('maestro_token');
};

export const setToken = (token: string): void => {
  sessionStorage.setItem('maestro_token', token);
};

export const removeToken = (): void => {
  sessionStorage.removeItem('maestro_token');
};

// Base fetch wrapper with auth + 401 interception
async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Auto-logout on 401 — but only when an existing session expired.
  // A rejected login attempt also returns 401; reloading the page there
  // would throw away the error message and restart the whole app.
  const isLoginAttempt = endpoint.includes('/auth/login');
  if (response.status === 401 && token && !isLoginAttempt) {
    removeToken();
    sessionStorage.removeItem('maestro_user');
    window.location.href = '/login';
  }

  return response;
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetchWithAuth(endpoint, options);

    // Read as text first: a proxy, a suspended host or an SPA rewrite answers with HTML or
    // an empty body, and response.json() would throw a JSON syntax error that tells the
    // user nothing about what actually went wrong.
    const body = await response.text();
    let data: (T & { error?: string; message?: string }) | null = null;
    try {
      data = body ? JSON.parse(body) : null;
    } catch {
      return {
        success: false,
        error: `Server returned a non-JSON response (HTTP ${response.status}). Check the API URL.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `Request failed (HTTP ${response.status})`,
      };
    }

    if (data === null) {
      return { success: false, error: `Server returned an empty response (HTTP ${response.status})` };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

// =============================================
// OMC AUTH ENDPOINTS
// =============================================

export const omcAuth = {
  login: async (email: string, password: string) => {
    return apiRequest<OmcLoginResponse>('/omc/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  forgotPassword: async (email: string) => {
    return apiRequest<MessageResponse>('/omc/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    return apiRequest<MessageResponse>('/omc/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<MessageResponse>('/omc/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },
};

// =============================================
// OMC CUSTOMER MANAGEMENT
// =============================================

export const omcCustomers = {
  register: async (data: { email: string; password: string; name: string; phone?: string; address?: string }) => {
    return apiRequest<CustomerDetailResponse>('/omc/customers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return apiRequest<CustomersListResponse>('/omc/customers', {
      method: 'GET',
    });
  },

  getById: async (id: string) => {
    return apiRequest<CustomerDetailResponse>(`/omc/customers/${id}`, {
      method: 'GET',
    });
  },

  update: async (id: string, data: Partial<{ name: string; phone: string; address: string }>) => {
    return apiRequest<MessageResponse>(`/omc/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<MessageResponse>(`/omc/customers/${id}`, {
      method: 'DELETE',
    });
  },

  getDrivers: async (customerId: string) => {
    return apiRequest<DriversListResponse>(`/omc/customers/${customerId}/drivers`, {
      method: 'GET',
    });
  },

  getVehicles: async (customerId: string) => {
    return apiRequest<VehiclesListResponse>(`/omc/customers/${customerId}/vehicles`, {
      method: 'GET',
    });
  },
};

// =============================================
// OMC ORDER MANAGEMENT
// =============================================

export const omcOrders = {
  getAll: async () => {
    return apiRequest<OrdersListResponse>('/omc/orders', {
      method: 'GET',
    });
  },

  getByStatus: async (status: string) => {
    return apiRequest<OrdersListResponse>(`/omc/orders?status=${status}`, {
      method: 'GET',
    });
  },

  approve: async (orderId: string) => {
    return apiRequest<MessageResponse>(`/omc/orders/${orderId}/approve`, {
      method: 'PUT',
    });
  },

  reject: async (orderId: string, reason: string) => {
    return apiRequest<MessageResponse>(`/omc/orders/${orderId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  update: async (
    orderId: string,
    data: Partial<{ requested_fuel: number; fuel_grade: string; destination: string }>,
  ) => {
    return apiRequest<MessageResponse>(`/omc/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  regenerateOtp: async (orderId: string) => {
    return apiRequest<OtpRequestResponse>(`/omc/orders/${orderId}/regenerate-otp`, {
      method: 'POST',
    });
  },

  delete: async (orderId: string) => {
    return apiRequest<MessageResponse>(`/omc/orders/${orderId}`, {
      method: 'DELETE',
    });
  },
};

// =============================================
// CUSTOMER AUTH ENDPOINTS
// =============================================

export const customerAuth = {
  login: async (email: string, password: string) => {
    return apiRequest<CustomerLoginResponse>('/customer/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  forgotPassword: async (email: string) => {
    return apiRequest<MessageResponse>('/customer/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    return apiRequest<MessageResponse>('/customer/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<MessageResponse>('/customer/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },

  getProfile: async () => {
    return apiRequest<CustomerProfileResponse>('/customer/profile', {
      method: 'GET',
    });
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: string }) => {
    return apiRequest<MessageResponse>('/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// =============================================
// CUSTOMER DRIVER MANAGEMENT
// =============================================

export const customerDrivers = {
  getAll: async () => {
    return apiRequest<DriversListResponse>('/customer/drivers', {
      method: 'GET',
    });
  },

  create: async (data: { name: string; phone: string; password: string; email?: string; nrc?: string; nationality?: string }) => {
    return apiRequest<DriverDetailResponse>('/customer/drivers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Bulk-register drivers, each with a truck. One row = one driver + one vehicle.
  // Surfaces per-row errors (results[]) so the page can flag bad rows.
  bulkRegister: async (
    drivers: { name: string; truck_number: string; phone: string }[],
  ): Promise<{
    success: boolean;
    data?: { message: string; created: number; drivers: { driver_id: string; name: string; phone: string; vehicle_id: string; truck_number: string }[] };
    error?: string;
    rowErrors?: { index: number; error: string }[];
  }> => {
    try {
      const response = await fetchWithAuth('/customer/drivers/bulk', {
        method: 'POST',
        body: JSON.stringify({ drivers }),
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Bulk registration failed',
          rowErrors: Array.isArray(data.results) ? data.results : undefined,
        };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  update: async (id: string, data: Partial<{ name: string; phone: string; email: string; nrc: string; nationality: string }>) => {
    return apiRequest<MessageResponse>(`/customer/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<MessageResponse>(`/customer/drivers/${id}`, {
      method: 'DELETE',
    });
  },
};

// =============================================
// CUSTOMER VEHICLE MANAGEMENT
// =============================================

export const customerVehicles = {
  getAll: async () => {
    return apiRequest<VehiclesListResponse>('/customer/vehicles', {
      method: 'GET',
    });
  },

  create: async (data: { registration_number: string; vehicle_type?: string; driver_id?: string; tank_capacity?: number }) => {
    return apiRequest<VehicleDetailResponse>('/customer/vehicles/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<{ registration_number: string; vehicle_type: string; driver_id: string; tank_capacity: number }>) => {
    return apiRequest<MessageResponse>(`/customer/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<MessageResponse>(`/customer/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};

// =============================================
// CUSTOMER ORDER MANAGEMENT
// =============================================

export const customerOrders = {
  getAll: async () => {
    return apiRequest<OrdersListResponse>('/customer/orders', {
      method: 'GET',
    });
  },

  create: async (data: { driver_id: string; vehicle_id: string; requested_fuel: number; fuel_grade: string; destination?: string; attendant_id?: string }) => {
    return apiRequest<OrderCreateResponse>('/customer/orders/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  send: async (orderId: string) => {
    return apiRequest<MessageResponse>(`/customer/orders/${orderId}/send`, {
      method: 'PUT',
    });
  },

  // Create many orders in one transactional request. On a 400 the backend
  // returns per-row errors in `rowErrors` (no orders are created); on success
  // every order is created atomically.
  bulk: async (
    orders: BulkOrderInput[],
    autoSend = false,
  ): Promise<{
    success: boolean;
    data?: BulkOrderCreateResponse;
    error?: string;
    rowErrors?: BulkOrderRowError[];
  }> => {
    try {
      const response = await fetchWithAuth('/customer/orders/bulk', {
        method: 'POST',
        body: JSON.stringify({ orders, auto_send: autoSend }),
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Bulk request failed',
          rowErrors: Array.isArray(data.results) ? data.results : undefined,
        };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  update: async (orderId: string, data: { driver_id?: string; vehicle_id?: string; requested_fuel?: number; fuel_grade?: string; attendant_id?: string }) => {
    return apiRequest<MessageResponse>(`/customer/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  cancel: async (orderId: string) => {
    return apiRequest<MessageResponse>(`/customer/orders/${orderId}`, {
      method: 'DELETE',
    });
  },
};

// =============================================
// DRIVER AUTH ENDPOINTS
// =============================================

export const driverAuth = {
  login: async (phone: string, password: string) => {
    return apiRequest<DriverLoginResponse>('/driver/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  },

  forgotPassword: async (email: string) => {
    return apiRequest<MessageResponse>('/driver/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    return apiRequest<MessageResponse>('/driver/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<MessageResponse>('/driver/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },

  getProfile: async () => {
    return apiRequest<DriverProfileResponse>('/driver/profile', {
      method: 'GET',
    });
  },

  updateProfile: async (data: { name?: string; email?: string }) => {
    return apiRequest<DriverProfileResponse>('/driver/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// =============================================
// DRIVER OTP MANAGEMENT
// =============================================

export const driverOtp = {
  getOrders: async () => {
    return apiRequest<OrdersListResponse>('/driver/orders', {
      method: 'GET',
    });
  },

  getOrderById: async (orderId: string) => {
    return apiRequest<OrderDetailResponse>(`/driver/orders/${orderId}`, {
      method: 'GET',
    });
  },

  requestOtp: async (orderId: string, resendSms: boolean = false) => {
    return apiRequest<OtpRequestResponse>('/driver/otp/request', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, resend_sms: resendSms }),
    });
  },

  complete: async (orderId: string) => {
    return apiRequest<MessageResponse>(`/driver/orders/${orderId}/complete`, {
      method: 'PUT',
    });
  },
};

// =============================================
// STATION ENDPOINTS
// =============================================

export const station = {
  verify: async (phone: string, otp: string, stationId?: string) => {
    return apiRequest<StationVerifyResponse>('/station/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, station_id: stationId }),
    });
  },

  checkOrder: async (orderId: string) => {
    return apiRequest<StationCheckOrderResponse>(`/station/check-order/${orderId}`, {
      method: 'GET',
    });
  },
};

// =============================================
// CUSTOMER BALANCE ENDPOINTS
// =============================================

export const customerBalance = {
  get: async () => {
    return apiRequest<CustomerBalanceResponse>('/customer/balance', {
      method: 'GET',
    });
  },

  getHistory: async (limit = 50, offset = 0, type?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (type) params.append('type', type);
    return apiRequest<BalanceHistoryResponse>(`/customer/balance/history?${params}`, {
      method: 'GET',
    });
  },
};

// =============================================
// OMC BALANCE MANAGEMENT ENDPOINTS
// =============================================

export const omcBalance = {
  getAll: async () => {
    return apiRequest<OmcBalancesListResponse>('/omc/balances', {
      method: 'GET',
    });
  },

  getCustomerBalance: async (customerId: string) => {
    return apiRequest<OmcCustomerBalanceResponse>(`/omc/customers/${customerId}/balance`, {
      method: 'GET',
    });
  },

  getCustomerHistory: async (customerId: string, limit = 50, offset = 0, type?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (type) params.append('type', type);
    return apiRequest<BalanceHistoryResponse>(`/omc/customers/${customerId}/balance/history?${params}`, {
      method: 'GET',
    });
  },

  addFunds: async (customerId: string, amount: number, transactionType: 'prepayment' | 'adjustment' | 'refund', notes?: string) => {
    return apiRequest<BalanceUpdateResponse>(`/omc/customers/${customerId}/balance`, {
      method: 'POST',
      body: JSON.stringify({ amount, transaction_type: transactionType, notes }),
    });
  },

  deduct: async (customerId: string, amount: number, orderId?: string, notes?: string) => {
    return apiRequest<BalanceUpdateResponse>(`/omc/customers/${customerId}/balance/deduct`, {
      method: 'POST',
      body: JSON.stringify({ amount, order_id: orderId, notes }),
    });
  },

  setBalance: async (customerId: string, newBalance: number, notes: string) => {
    return apiRequest<BalanceUpdateResponse>(`/omc/customers/${customerId}/balance/set`, {
      method: 'PUT',
      body: JSON.stringify({ new_balance: newBalance, notes }),
    });
  },
};

export default {
  omcAuth,
  omcCustomers,
  omcOrders,
  customerAuth,
  customerDrivers,
  customerVehicles,
  customerOrders,
  driverAuth,
  driverOtp,
  station,
  customerBalance,
  omcBalance,
};

