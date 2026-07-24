import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Fuel,
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  LogOut,
  ChevronRight,
  User,
  Truck,
  Car,
  Building2,
  Users,
  Clock,
  History,
  Settings,
  Menu,
  X,
  Wallet,
  Droplets,
  MapPin,
  UserCheck,
  Receipt,
  DollarSign,
  Calendar,
  BarChart3,
  Calculator,
  Layers,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOmc = user?.role === 'omc';
  const isDriver = user?.role === 'driver';
  const isCustomer = user?.role === 'customer';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const homeRoute = isOmc ? '/omc' : isDriver ? '/driver' : '/dashboard';

  return (
    <div className="app-layout">
      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="topbar-brand" onClick={() => navigate(homeRoute)}>
            <div className="topbar-logo">
              <Fuel size={20} />
            </div>
            <span className="topbar-brand-text">Maestro Fuel</span>
          </div>
          <div className="topbar-divider" />
          <span className="topbar-company">
            {isOmc ? 'OMC Portal' : user?.companyName || 'Fuel Portal'}
          </span>
        </div>

        <div className="topbar-right">
          {isCustomer && (
            <button
              className="topbar-create-btn"
              title="New Order"
              onClick={() => navigate('/dashboard/new-order')}
            >
              <PlusCircle size={20} />
            </button>
          )}
          <div className="topbar-user-btn">
            <div className="topbar-avatar">{initials}</div>
            <span className="topbar-user-name">{user?.name}</span>
          </div>
          <button className="topbar-logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={handleOverlayClick} />}

      {/* ── Body: Sidebar + Content ── */}
      <div className="app-body">
        {/* ── Sidebar ── */}
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-top">
            <nav className="sidebar-nav">
              <span className="sidebar-section-label">Menu</span>

              {isOmc && (
                <>
                  <NavLink to="/omc" end className="sidebar-link">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/customers" className="sidebar-link">
                    <Users size={18} />
                    <span>Manage Customers</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/pending" className="sidebar-link">
                    <Clock size={18} />
                    <span>Pending Orders</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/orders" className="sidebar-link">
                    <ClipboardList size={18} />
                    <span>All Orders</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/financials" className="sidebar-link">
                    <Wallet size={18} />
                    <span>Financials</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/debtors" className="sidebar-link">
                    <User size={18} />
                    <span>Debtors</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/add-debtor" className="sidebar-link">
                    <PlusCircle size={18} />
                    <span>Add Debtor</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/accounting" className="sidebar-link">
                    <Calculator size={18} />
                    <span>Accounting</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>

                  <span className="sidebar-section-label">Reports</span>
                  <NavLink to="/omc/reports" className="sidebar-link">
                    <BarChart3 size={18} />
                    <span>Reports</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/tank-levels" className="sidebar-link">
                    <Droplets size={18} />
                    <span>Tank Levels</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>

                  <span className="sidebar-section-label">Operations</span>
                  <NavLink to="/omc/stations" className="sidebar-link">
                    <MapPin size={18} />
                    <span>Stations</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/attendants" className="sidebar-link">
                    <UserCheck size={18} />
                    <span>Attendants</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/transactions" className="sidebar-link">
                    <Receipt size={18} />
                    <span>Transactions</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>

                  <span className="sidebar-section-label">Forecourt Operations</span>
                  <NavLink to="/omc/fuel-prices" className="sidebar-link">
                    <DollarSign size={18} />
                    <span>Fuel Prices</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/set-fuel-prices" className="sidebar-link">
                    <BarChart3 size={18} />
                    <span>Set Fuel Prices</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/omc/price-scheduler" className="sidebar-link">
                    <Calendar size={18} />
                    <span>Price Scheduler</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>

                  <span className="sidebar-section-label">Account</span>
                  <NavLink to="/omc/settings" className="sidebar-link">
                    <Settings size={18} />
                    <span>Settings</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                </>
              )}

              {isDriver && (
                <>
                  <NavLink to="/driver" end className="sidebar-link">
                    <LayoutDashboard size={18} />
                    <span>My Orders</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/driver/history" className="sidebar-link">
                    <History size={18} />
                    <span>Order History</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/driver/settings" className="sidebar-link">
                    <Settings size={18} />
                    <span>Settings</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                </>
              )}

              {isCustomer && (
                <>
                  <NavLink to="/dashboard" end className="sidebar-link">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/dashboard/new-order" className="sidebar-link">
                    <PlusCircle size={18} />
                    <span>New Order</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/dashboard/bulk-order" className="sidebar-link">
                    <Layers size={18} />
                    <span>Bulk Order</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/dashboard/orders" className="sidebar-link">
                    <ClipboardList size={18} />
                    <span>My Orders</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/dashboard/drivers" className="sidebar-link">
                    <Truck size={18} />
                    <span>Manage Drivers</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/dashboard/bulk-drivers" className="sidebar-link">
                    <Users size={18} />
                    <span>Bulk Register Drivers</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/dashboard/vehicles" className="sidebar-link">
                    <Car size={18} />
                    <span>Manage Vehicles</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/dashboard/balance" className="sidebar-link">
                    <Wallet size={18} />
                    <span>My Balance</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                  <NavLink to="/dashboard/settings" className="sidebar-link">
                    <Settings size={18} />
                    <span>Settings</span>
                    <ChevronRight size={14} className="sidebar-link-arrow" />
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Bottom / User */}
          <div className="sidebar-bottom">
            {isOmc && (
              <div className="sidebar-role-badge">
                <Building2 size={14} />
                Oil Marketing Company
              </div>
            )}
            {isDriver && (
              <div className="sidebar-role-badge">
                <Truck size={14} />
                Driver
              </div>
            )}
            {isCustomer && (
              <div className="sidebar-role-badge">
                <User size={14} />
                Customer
              </div>
            )}
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                <User size={16} />
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name}</span>
                <span className="sidebar-user-email">{user?.email}</span>
              </div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
