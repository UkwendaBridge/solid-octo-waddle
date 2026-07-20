import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import OrderCard from '../components/OrderCard';
import TableSkeleton from '../components/TableSkeleton';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function OmcPendingOrdersPage() {
  const { user } = useAuth();
  const { orders, isLoading, error, approveOrder, rejectOrder } = useOrders();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!user) return null;

  // Show orders with status 'sent' only (submitted by customer, awaiting OMC approval)
  // Draft orders are not visible to OMC, only to customer
  const pendingOrders = orders.filter(o => o.status === 'sent');

  const handleApprove = async (orderId: string) => {
    setProcessingId(orderId);
    await approveOrder(orderId);
    setProcessingId(null);
  };

  const handleReject = async (orderId: string) => {
    if (!rejectReason.trim()) return;
    setProcessingId(orderId);
    await rejectOrder(orderId, rejectReason.trim());
    setRejectingId(null);
    setRejectReason('');
    setProcessingId(null);
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="page">
        <div className="page-header"><h1>Pending Orders</h1></div>
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Pending Orders</h1>
          <p className="text-muted">
            {pendingOrders.length} orders awaiting OMC approval
          </p>
        </div>
        <div className="stat-badge-inline">
          <Clock size={18} />
          <span>{pendingOrders.length} Pending</span>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {pendingOrders.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={48} />
          <h3>All Clear!</h3>
          <p>No pending orders to review.</p>
        </div>
      ) : (
        <div className="orders-list">
          {pendingOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              actions={
                <div className="manager-actions">
                  {rejectingId === order.id ? (
                    <div className="reject-form">
                      <AlertTriangle size={16} className="text-warning" />
                      <input
                        type="text"
                        placeholder="Enter rejection reason..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        autoFocus
                      />
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(order.id)}
                        disabled={!rejectReason.trim() || processingId === order.id}
                      >
                        {processingId === order.id ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Reject'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => handleApprove(order.id)}
                        disabled={processingId === order.id}
                      >
                        {processingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Approve Order
                      </button>
                      <button
                        className="btn btn-danger-outline"
                        onClick={() => setRejectingId(order.id)}
                        disabled={processingId === order.id}
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
