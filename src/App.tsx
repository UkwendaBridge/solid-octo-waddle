import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazyWithRetry as lazy } from './lib/lazyWithRetry';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { DriverProvider } from './context/DriverContext';
import { VehicleProvider } from './context/VehicleContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';
import NotificationPrompt from './components/NotificationPrompt';
import ToastContainer from './components/ToastContainer';

// Lazy-loaded pages — each role only loads what it needs
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const NewOrderPage = lazy(() => import('./pages/NewOrderPage'));
const BulkOrderPage = lazy(() => import('./pages/BulkOrderPage'));
const CustomerOrdersPage = lazy(() => import('./pages/CustomerOrdersPage'));
const DriverPage = lazy(() => import('./pages/DriverPage'));
const BulkDriverPage = lazy(() => import('./pages/BulkDriverPage'));
const CustomerReportsPage = lazy(() => import('./pages/CustomerReportsPage'));
const VehiclePage = lazy(() => import('./pages/VehiclePage'));
const OmcDashboard = lazy(() => import('./pages/OmcDashboard'));
const OmcReportsPage = lazy(() => import('./pages/OmcReportsPage'));
const OmcCustomersPage = lazy(() => import('./pages/OmcCustomersPage'));
const OmcPendingOrdersPage = lazy(() => import('./pages/OmcPendingOrdersPage'));
const OmcAllOrdersPage = lazy(() => import('./pages/OmcAllOrdersPage'));
const FinancialsPage = lazy(() => import('./pages/FinancialsPage'));
const TankLevelsPage = lazy(() => import('./pages/TankLevelsPage'));
const StationsPage = lazy(() => import('./pages/StationsPage'));
const AttendantsPage = lazy(() => import('./pages/AttendantsPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const FuelPricesPage = lazy(() => import('./pages/FuelPricesPage'));
const SetFuelPricesPage = lazy(() => import('./pages/SetFuelPricesPage'));
const PriceSchedulerPage = lazy(() => import('./pages/PriceSchedulerPage'));
const DriverPortalPage = lazy(() => import('./pages/DriverPortalPage'));
const DriverOrderHistoryPage = lazy(() => import('./pages/DriverOrderHistoryPage'));
const DriverSettingsPage = lazy(() => import('./pages/DriverSettingsPage'));
const OmcSettingsPage = lazy(() => import('./pages/OmcSettingsPage'));
const DebtorsPage = lazy(() => import('./pages/DebtorsPage'));
const AddDebtorPage = lazy(() => import('./pages/AddDebtorPage'));
const CustomerSettingsPage = lazy(() => import('./pages/CustomerSettingsPage'));
const CustomerBalancePage = lazy(() => import('./pages/CustomerBalancePage'));
const OmcAccountingPage = lazy(() => import('./pages/OmcAccountingPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastContainer />
        <AuthProvider>
          <DriverProvider>
            <VehicleProvider>
              <OrderProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <NotificationPrompt />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />

                      {/* OMC Routes */}
                      <Route
                        path="/omc"
                        element={
                          <ProtectedRoute allowedRole="omc">
                            <Layout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<OmcDashboard />} />
                        <Route path="customers" element={<OmcCustomersPage />} />
                        <Route path="pending" element={<OmcPendingOrdersPage />} />
                        <Route path="orders" element={<OmcAllOrdersPage />} />
                        <Route path="financials" element={<FinancialsPage />} />
                        <Route path="debtors" element={<DebtorsPage />} />
                        <Route path="add-debtor" element={<AddDebtorPage />} />
                        <Route path="reports" element={<OmcReportsPage />} />
                        <Route path="tank-levels" element={<TankLevelsPage />} />
                        <Route path="stations" element={<StationsPage />} />
                        <Route path="attendants" element={<AttendantsPage />} />
                        <Route path="transactions" element={<TransactionsPage />} />
                        <Route path="fuel-prices" element={<FuelPricesPage />} />
                        <Route path="set-fuel-prices" element={<SetFuelPricesPage />} />
                        <Route path="price-scheduler" element={<PriceSchedulerPage />} />
                        <Route path="accounting" element={<OmcAccountingPage />} />
                        <Route path="settings" element={<OmcSettingsPage />} />
                      </Route>

                      {/* Customer Routes */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute allowedRole="customer">
                            <Layout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<CustomerDashboard />} />
                        <Route path="new-order" element={<NewOrderPage />} />
                        <Route path="bulk-order" element={<BulkOrderPage />} />
                        <Route path="orders" element={<CustomerOrdersPage />} />
                        <Route path="drivers" element={<DriverPage />} />
                        <Route path="bulk-drivers" element={<BulkDriverPage />} />
                        <Route path="reports" element={<CustomerReportsPage />} />
                        <Route path="vehicles" element={<VehiclePage />} />
                        <Route path="balance" element={<CustomerBalancePage />} />
                        <Route path="settings" element={<CustomerSettingsPage />} />
                      </Route>

                      {/* Driver Routes */}
                      <Route
                        path="/driver"
                        element={
                          <ProtectedRoute allowedRole="driver">
                            <Layout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<DriverPortalPage />} />
                        <Route path="history" element={<DriverOrderHistoryPage />} />
                        <Route path="settings" element={<DriverSettingsPage />} />
                      </Route>

                      {/* Default redirect */}
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </OrderProvider>
            </VehicleProvider>
          </DriverProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
