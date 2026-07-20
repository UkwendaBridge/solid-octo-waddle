import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import OrderCard from '../components/OrderCard';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { getOrdersByCustomer } = useOrders();
  const navigate = useNavigate();

  if (!user) return null;

  const myOrders = getOrdersByCustomer(user.id);
  const pending = myOrders.filter(o => o.status === 'pending').length;
  const approved = myOrders.filter(o => o.status === 'approved').length;
  const rejected = myOrders.filter(o => o.status === 'rejected').length;
  const completed = myOrders.filter(o => o.status === 'completed').length;
  const recentOrders = myOrders.slice(0, 3);

  return (
    <div className="page">
      <PageHeader
        title={`Welcome, ${user.name}`}
        subtitle={`${user.companyName} — Fuel Ordering Portal`}
        action={
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/new-order')}>
            <PlusCircle size={18} />
            New Fuel Order
          </button>
        }
      />

      <div className="stats-grid fade-in-up">
        <StatCard icon={<ClipboardList size={22} />} value={myOrders.length} label="Total Orders" color="blue" />
        <StatCard icon={<Clock size={22} />} value={pending} label="Pending" color="yellow" />
        <StatCard icon={<CheckCircle2 size={22} />} value={approved} label="Approved" color="green" />
        <StatCard icon={<XCircle size={22} />} value={rejected} label="Rejected" color="red" />
        <StatCard icon={<TrendingUp size={22} />} value={completed} label="Completed" color="purple" />
      </div>

      <div className="section fade-in-up">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard/orders')}>
            View All →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={48} />}
            description="No orders yet. Place your first fuel order!"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/dashboard/new-order')}>
                <PlusCircle size={18} />
                Place Order
              </button>
            }
          />
        ) : (
          <div className="orders-list fade-in-up">
            {recentOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
