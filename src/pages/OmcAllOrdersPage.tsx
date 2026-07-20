import { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import OrderCard from '../components/OrderCard';
import type { OrderStatus } from '../types';
import { Filter, ClipboardList, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'sent' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Completed', value: 'completed' },
];

export default function OmcAllOrdersPage() {
  const { orders, approveOrder, rejectOrder } = useOrders();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filtered = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

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

  // Check if order can be approved/rejected (only 'sent' orders - pending approval)
  const canActOnOrder = (status: string) => status === 'sent';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>All Orders</h1>
          <p className="text-muted">{orders.length} total orders across all customers</p>
        </div>
      </div>

      <div className="filter-bar">
        <Filter size={16} />
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${statusFilter === f.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>No orders found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.</p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map(order => (
            <OrderCard 
              key={order.id} 
              order={order}
              actions={canActOnOrder(order.status) ? (
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
                        Approve
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
              ) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
