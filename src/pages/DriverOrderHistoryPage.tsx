import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import OrderCard from '../components/OrderCard';
import TableSkeleton from '../components/TableSkeleton';
import { History } from 'lucide-react';

export default function DriverOrderHistoryPage() {
  const { user } = useAuth();
  const { orders, isLoading, error, fetchOrders } = useOrders();

  // Fetch orders when component mounts
  useEffect(() => {
    if (user?.role === 'driver') {
      fetchOrders();
    }
  }, [user?.role, fetchOrders]);

  if (!user || user.role !== 'driver') {
    return (
      <div className="page">
        <div className="page-header"><h1>Order History</h1></div>
        <p>No driver profile is linked to this account.</p>
      </div>
    );
  }

  // Filter for completed/rejected orders (history)
  const completedOrders = orders.filter(o => ['completed', 'rejected'].includes(o.status));

  if (isLoading && orders.length === 0) {
    return (
      <div className="page">
        <div className="page-header"><h1>Order History</h1></div>
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Order History</h1>
          <p className="text-muted">{completedOrders.length} past orders</p>
        </div>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      {completedOrders.length === 0 ? (
        <div className="empty-state">
          <History size={48} />
          <h3>No History Yet</h3>
          <p>Your completed and rejected orders will appear here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {completedOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
