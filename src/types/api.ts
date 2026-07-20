// =============================================
// Backend API Response Types
// Replaces all `any` usage in the API layer
// =============================================

// ── Auth Responses ──

export interface BackendOmcUser {
  id: string;
  name: string;
  email: string;
  company_name?: string;
}

export interface OmcLoginResponse {
  token: string;
  user: BackendOmcUser;
}

export interface BackendCustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address?: string;
  created_at?: string;
}

export interface CustomerLoginResponse {
  token: string;
  customer: BackendCustomerProfile;
}

export interface BackendDriverProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  customer_id?: string;
  nrc?: string;
  nationality?: string;
}

export interface DriverLoginResponse {
  token: string;
  driver: BackendDriverProfile;
}

// ── Customer / OMC list responses ──

export interface CustomersListResponse {
  customers: BackendCustomerProfile[];
}

export interface CustomerDetailResponse {
  customer: BackendCustomerProfile;
}

// ── Driver list responses ──

export interface DriversListResponse {
  drivers: BackendDriverProfile[];
}

export interface DriverDetailResponse {
  driver: BackendDriverProfile;
}

// ── Vehicle responses ──

export interface BackendVehicle {
  id: string;
  registration_number: string;
  vehicle_type?: string;
  tank_capacity?: number;
  customer_id: string;
  driver_id?: string;
}

export interface VehiclesListResponse {
  vehicles: BackendVehicle[];
}

export interface VehicleDetailResponse {
  vehicle: BackendVehicle;
}

// ── Order responses ──

export interface BackendOrder {
  id: string;
  customer_id: string;
  customer_name?: string;
  site_id?: string;
  driver_id: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_id: string;
  registration_number?: string;
  vehicle_registration?: string;
  vehicle_type?: string;
  tank_capacity?: number;
  // Backend may serialize this as string or number — always use parseFloat(String(value)) when consuming
  requested_fuel: string | number;
  fuel_grade: string;
  otp_code?: string;
  status: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  completed_at?: string;
}

export interface OrdersListResponse {
  orders: BackendOrder[];
}

export interface OrderDetailResponse {
  order: BackendOrder;
}

export interface OrderCreateResponse {
  order: BackendOrder;
}

export interface BulkOrderInput {
  driver_id: string;
  vehicle_id: string;
  requested_fuel: number;
  fuel_grade: 'petrol' | 'diesel';
}

export interface BulkOrderRowError {
  index: number;
  error: string;
}

export interface BulkOrderCreateResponse {
  message: string;
  created: number;
  orders: BackendOrder[];
}

// Returned with a 400 when one or more rows fail validation (no orders created).
export interface BulkOrderValidationError {
  error: string;
  results: BulkOrderRowError[];
}

// ── OTP responses ──

export interface OtpRequestResponse {
  otp: string;
  expires_at: string;
}

// ── Station verification ──

export interface StationVerifyResponse {
  verified: boolean;
  message: string;
  order: BackendOrder;
}

export interface StationCheckOrderResponse {
  order: BackendOrder;
}

// ── Profile responses ──

export interface CustomerProfileResponse {
  customer: BackendCustomerProfile;
}

export interface DriverProfileResponse {
  profile: BackendDriverProfile;
}

// ── Generic message response ──

export interface MessageResponse {
  message: string;
}

// ── Balance responses ──

// Balance fields may be serialized as strings by the backend — use parseFloat(String(value)) when consuming
export interface BackendBalanceTransaction {
  id: string;
  customer_id: string;
  amount: string | number;
  transaction_type: 'prepayment' | 'fuel_debit' | 'adjustment' | 'refund';
  reference_id?: string;
  notes?: string;
  performed_by_type: 'omc' | 'customer' | 'system' | 'station';
  performed_by_id: string;
  performed_by_name?: string;
  balance_before: string | number;
  balance_after: string | number;
  created_at: string;
}

export interface CustomerBalanceResponse {
  balance: number;
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BalanceHistoryResponse {
  transactions: BackendBalanceTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface OmcCustomerBalanceResponse {
  customer: {
    id: string;
    name: string;
    email: string;
    balance: string | number;
  };
  balance: number;
  recent_transactions: BackendBalanceTransaction[];
  total_transactions: number;
}

export interface OmcBalancesListResponse {
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    balance: string | number;
    created_at: string;
  }>;
  summary: {
    total_customers: number;
    total_balance: number;
    positive_balances: number;
    negative_balances: number;
  };
}

export interface BalanceUpdateResponse {
  message: string;
  customer_name: string;
  new_balance: number;
  transaction: BackendBalanceTransaction;
}
