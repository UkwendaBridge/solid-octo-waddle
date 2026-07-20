import { useOrders } from '../context/OrderContext';
import { useCustomers } from '../context/CustomerContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  DollarSign,
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function OmcDashboard() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const navigate = useNavigate();

  const pending = orders.filter(o => o.status === 'sent').length;
  const approved = orders.filter(o => o.status === 'approved').length;
  const rejected = orders.filter(o => o.status === 'rejected').length;
  const completed = orders.filter(o => o.status === 'completed').length;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="page">
      {/* Welcome Banner */}
      <div className="welcome-banner fade-in-up">
        <div className="welcome-banner-text">
          <h1>Welcome back, {user?.name ?? 'Admin'} 👋</h1>
          <p>{user?.companyName ? `${user.companyName} · ` : ''}{today}</p>
        </div>
        {pending > 0 && (
          <button className="btn btn-white" onClick={() => navigate('/omc/pending')}>
            <Clock size={16} />
            {pending} Pending Review
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid fade-in-up" style={{ animationDelay: '0.05s' }}>
        <StatCard icon={<Users size={22} />} value={customers.length} label="Total Customers" color="blue" onClick={() => navigate('/omc/customers')} />
        <StatCard icon={<ClipboardList size={22} />} value={orders.length} label="Total Orders" color="purple" onClick={() => navigate('/omc/orders')} />
        <StatCard icon={<Clock size={22} />} value={pending} label="Pending Approval" color="yellow" onClick={() => navigate('/omc/pending')} />
        <StatCard icon={<CheckCircle2 size={22} />} value={approved} label="Approved" color="green" />
        <StatCard icon={<XCircle size={22} />} value={rejected} label="Rejected" color="red" />
        <StatCard icon={<TrendingUp size={22} />} value={completed} label="Completed" color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="section fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => navigate('/omc/customers')}>
            <span className="quick-action-icon quick-action-icon-green"><PlusCircle size={20} /></span>
            <div className="quick-action-body">
              <span className="quick-action-label">Add Customer</span>
              <span className="quick-action-sub">Register a new account</span>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>
          <button className="quick-action-card" onClick={() => navigate('/omc/pending')}>
            <span className="quick-action-icon quick-action-icon-yellow"><Clock size={20} /></span>
            <div className="quick-action-body">
              <span className="quick-action-label">Review Pending</span>
              <span className="quick-action-sub">{pending} order{pending !== 1 ? 's' : ''} awaiting approval</span>
            </div>
            {pending > 0 && <span className="quick-action-badge">{pending}</span>}
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>
          <button className="quick-action-card" onClick={() => navigate('/omc/fuel-prices')}>
            <span className="quick-action-icon quick-action-icon-blue"><DollarSign size={20} /></span>
            <div className="quick-action-body">
              <span className="quick-action-label">Fuel Prices</span>
              <span className="quick-action-sub">Update price schedules</span>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="section fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="section-header">
            <h2>Recent Orders</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/omc/orders')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="mini-table-wrapper">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Volume</th>
                  <th>Fuel</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="order-id-cell">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td>{order.customerName}</td>
                    <td>{order.fuelVolumeAllocated.toLocaleString()} L</td>
                    <td>{order.fuelType}</td>
                    <td>
                      <span className={`status-chip status-chip-${order.status}`}>
                        {order.status === 'sent' ? 'Pending' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="date-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
