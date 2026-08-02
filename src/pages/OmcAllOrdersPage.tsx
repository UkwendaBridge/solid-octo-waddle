import { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import OrderCard from '../components/OrderCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { omcOrders } from '../services/api';
import type { OrderStatus, FuelOrder } from '../types';
import { Filter, ClipboardList, CheckCircle2, XCircle, AlertTriangle, Loader2, Pencil, KeyRound, Trash2, Check, X } from 'lucide-react';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'sent' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Completed', value: 'completed' },
];

export default function OmcAllOrdersPage() {
  const { orders, approveOrder, rejectOrder, fetchOrders } = useOrders();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modify state
  const [editOrder, setEditOrder] = useState<FuelOrder | null>(null);
  const [editFuel, setEditFuel] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionsOrder, setActionsOrder] = useState<FuelOrder | null>(null);

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
  // Any order that isn't finished can still be modified.
  const canModifyOrder = (status: string) => status !== 'completed';

  const openEdit = (order: FuelOrder) => {
    setEditOrder(order);
    setEditFuel(String(order.fuelVolumeAllocated ?? ''));
    setEditGrade(order.fuelType.toLowerCase());
    setEditDestination('');
  };

  const saveEdit = async () => {
    if (!editOrder) return;
    setIsSaving(true);
    const fuel = parseFloat(editFuel);
    const res = await omcOrders.update(editOrder.id, {
      requested_fuel: Number.isFinite(fuel) ? fuel : undefined,
      fuel_grade: editGrade.trim() || undefined,
      destination: editDestination.trim() || undefined,
    });
    setIsSaving(false);
    if (res.success) {
      toast.success('Order updated');
      setEditOrder(null);
      fetchOrders();
    } else {
      toast.error(res.error || 'Failed to update order');
    }
  };

  const regenerateOtp = async (orderId: string) => {
    setBusyId(orderId);
    const res = await omcOrders.regenerateOtp(orderId);
    setBusyId(null);
    if (res.success) {
      toast.success('OTP regenerated');
      fetchOrders();
    } else {
      toast.error(res.error || 'Failed to regenerate OTP');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setBusyId(id);
    const res = await omcOrders.delete(id);
    setBusyId(null);
    setDeleteId(null);
    if (res.success) {
      toast.success('Order deleted');
      fetchOrders();
    } else {
      toast.error(res.error || 'Failed to delete order');
    }
  };

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
              onClick={() => setActionsOrder(order)}
              actions={
                canActOnOrder(order.status) ? (
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
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Order actions (opened by clicking a card) */}
      {actionsOrder && (
        <div className="modal-overlay" onClick={() => setActionsOrder(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-actions-title"
          >
            <div className="modal-header">
              <h2 id="order-actions-title">Order {actionsOrder.id}</h2>
              <button className="modal-close" onClick={() => setActionsOrder(null)} aria-label="Close dialog">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {canModifyOrder(actionsOrder.status) ? (
                <div className="modal-actions-grid">
                  <button
                    className="btn btn-outline"
                    onClick={() => { openEdit(actionsOrder); setActionsOrder(null); }}
                    disabled={busyId === actionsOrder.id}
                  >
                    <Pencil size={16} />
                    Edit Order
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => regenerateOtp(actionsOrder.id)}
                    disabled={busyId === actionsOrder.id}
                  >
                    {busyId === actionsOrder.id ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    Regenerate OTP
                  </button>
                  <button
                    className="btn btn-danger-outline"
                    onClick={() => { setDeleteId(actionsOrder.id); setActionsOrder(null); }}
                    disabled={busyId === actionsOrder.id}
                  >
                    <Trash2 size={16} />
                    Delete Order
                  </button>
                </div>
              ) : (
                <p className="text-muted">Completed orders cannot be modified.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit order */}
      {editOrder && (
        <div className="modal-overlay" onClick={() => setEditOrder(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-title"
          >
            <div className="modal-header">
              <h2 id="edit-order-title">
                <Pencil size={20} style={{ marginRight: 8, verticalAlign: '-4px' }} />
                Edit Order {editOrder.id}
              </h2>
              <button className="modal-close" onClick={() => setEditOrder(null)} aria-label="Close dialog">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-order-fuel">Requested Fuel (litres)</label>
                <input
                  id="edit-order-fuel"
                  type="number"
                  min="0"
                  value={editFuel}
                  onChange={e => setEditFuel(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-order-grade">Fuel Grade</label>
                <select id="edit-order-grade" value={editGrade} onChange={e => setEditGrade(e.target.value)}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-order-destination">Destination</label>
                <input
                  id="edit-order-destination"
                  type="text"
                  placeholder="Leave blank to keep unchanged"
                  value={editDestination}
                  onChange={e => setEditDestination(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditOrder(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
