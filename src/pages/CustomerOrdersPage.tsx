import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useDrivers } from '../context/DriverContext';
import { useVehicles } from '../context/VehicleContext';
import OrderCard from '../components/OrderCard';
import type { OrderStatus, FuelOrder } from '../types';
import { Filter, ClipboardList, Send, Loader2, Pencil, X } from 'lucide-react';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Completed', value: 'completed' },
];

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const { orders, sendOrder, updateOrder, error } = useOrders();
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<FuelOrder | null>(null);
  const [editForm, setEditForm] = useState({
    driverId: '',
    vehicleId: '',
    fuelVolume: 0,
    fuelType: 'Diesel' as 'Petrol' | 'Diesel',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  if (!user) return null;

  // Filter orders for this customer
  const allOrders = orders.filter(o => o.customerId === user.id);
  const filtered = statusFilter === 'all'
    ? allOrders
    : allOrders.filter(o => o.status === statusFilter);

  const handleSendOrder = async (orderId: string) => {
    setSendingId(orderId);
    await sendOrder(orderId);
    setSendingId(null);
  };

  const handleEditClick = (order: FuelOrder) => {
    setEditingOrder(order);
    setEditForm({
      driverId: order.driverId,
      vehicleId: order.vehicleId,
      fuelVolume: order.fuelVolumeAllocated,
      fuelType: order.fuelType,
    });
    setEditError(null);
  };

  const handleCloseEdit = () => {
    setEditingOrder(null);
    setEditError(null);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    
    setIsUpdating(true);
    setEditError(null);
    
    const success = await updateOrder(editingOrder.id, {
      driver_id: editForm.driverId,
      vehicle_id: editForm.vehicleId,
      requested_fuel: editForm.fuelVolume,
      fuel_grade: editForm.fuelType.toLowerCase() as 'petrol' | 'diesel',
    });
    
    if (success) {
      setEditingOrder(null);
    } else {
      setEditError('Failed to update order');
    }
    
    setIsUpdating(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Orders</h1>
          <p className="text-muted">{allOrders.length} total orders</p>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

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
              actions={order.status === 'draft' ? (
                <div className="manager-actions">
                  <button
                    className="btn btn-secondary mr-2"
                    onClick={() => handleEditClick(order)}
                  >
                    <Pencil size={18} />
                    Edit Order
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSendOrder(order.id)}
                    disabled={sendingId === order.id}
                  >
                    {sendingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Send to OMC for Approval
                  </button>
                </div>
              ) : undefined}
            />
          ))}
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="m-0 text-lg font-bold">Edit Order</h2>
              <button className="modal-close" onClick={handleCloseEdit}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {editError && <div className="form-error mb-4">{editError}</div>}
              
              {/* Order Details (Read-only) */}
              <div className="order-details-section">
                <h4 className="section-title">Order Details</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Order ID</span>
                    <span className="detail-value">{editingOrder.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge status-${editingOrder.status}`}>
                      {editingOrder.status.charAt(0).toUpperCase() + editingOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Customer</span>
                    <span className="detail-value">{editingOrder.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Site ID</span>
                    <span className="detail-value">{editingOrder.siteId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">
                      {new Date(editingOrder.createdAt).toLocaleDateString('en-ZA', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {editingOrder.approvedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Approved</span>
                      <span className="detail-value">
                        {new Date(editingOrder.approvedAt).toLocaleDateString('en-ZA', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {editingOrder.approvedBy && ` by ${editingOrder.approvedBy}`}
                      </span>
                    </div>
                  )}
                  {editingOrder.rejectionReason && (
                    <div className="detail-item detail-full">
                      <span className="detail-label">Rejection Reason</span>
                      <span className="detail-value text-danger">{editingOrder.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Assignment (Read-only) */}
              <div className="order-details-section">
                <h4 className="section-title">Current Assignment</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Driver</span>
                    <span className="detail-value">{editingOrder.driverName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Driver Phone</span>
                    <span className="detail-value">{editingOrder.driverPhone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Vehicle Reg</span>
                    <span className="detail-value">{editingOrder.vehicleRegNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Vehicle Type</span>
                    <span className="detail-value">{editingOrder.vehicleType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tank Capacity</span>
                    <span className="detail-value">{editingOrder.tankCapacity} L</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Fuel Allocated</span>
                    <span className="detail-value">{editingOrder.fuelVolumeAllocated} L ({editingOrder.fuelType})</span>
                  </div>
                </div>
              </div>

              {/* OTP Info */}
              {editingOrder.otp && (
                <div className="order-details-section">
                  <h4 className="section-title">OTP Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">OTP Code</span>
                      <span className="detail-value otp-code">{editingOrder.otp}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">OTP Status</span>
                      <span className={`detail-value ${editingOrder.otpActive ? 'text-success' : 'text-muted'}`}>
                        {editingOrder.otpActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {editingOrder.otpExpiresAt && (
                      <div className="detail-item">
                        <span className="detail-label">Expires</span>
                        <span className="detail-value">
                          {new Date(editingOrder.otpExpiresAt).toLocaleString('en-ZA')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Editable Fields */}
              <div className="order-details-section">
                <h4 className="section-title">Update Order</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Driver</label>
                    <select
                      className="form-select"
                      value={editForm.driverId}
                      onChange={e => setEditForm(prev => ({ ...prev, driverId: e.target.value }))}
                    >
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Vehicle</label>
                    <select
                      className="form-select"
                      value={editForm.vehicleId}
                      onChange={e => setEditForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.regNumber} - {v.type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fuel Volume (Liters)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.fuelVolume}
                      onChange={e => setEditForm(prev => ({ ...prev, fuelVolume: parseFloat(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Fuel Type</label>
                    <select
                      className="form-select"
                      value={editForm.fuelType}
                      onChange={e => setEditForm(prev => ({ ...prev, fuelType: e.target.value as 'Petrol' | 'Diesel' }))}
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Petrol">Petrol</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseEdit}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateOrder}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
