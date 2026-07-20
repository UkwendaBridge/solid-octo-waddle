import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useDrivers } from '../context/DriverContext';
import { useVehicles } from '../context/VehicleContext';
import type { NewOrderFormData, FuelType } from '../types';
import {
  Send,
  Fuel,
  MapPin,
  User,
  Car,
  Droplets,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const FUEL_TYPES: FuelType[] = ['Petrol', 'Diesel'];

export default function NewOrderPage() {
  const { user } = useAuth();
  const { placeOrder, sites } = useOrders();
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const navigate = useNavigate();

  const [form, setForm] = useState<NewOrderFormData>({
    siteId: '',
    driverId: '',
    vehicleId: '',
    fuelVolumeAllocated: 0,
    fuelType: 'Diesel',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewOrderFormData, string>>>({});
  const [submitted, setSubmitted] = useState<{ orderId: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!user) return null;

  const myDrivers = drivers;
  const myVehicles = vehicles;

  const selectedDriver = myDrivers.find(d => d.id === form.driverId);
  const selectedVehicle = myVehicles.find(v => v.id === form.vehicleId);

  const updateField = <K extends keyof NewOrderFormData>(key: K, value: NewOrderFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof NewOrderFormData, string>> = {};

    if (!form.siteId) newErrors.siteId = 'Please select a site';
    if (!form.driverId) newErrors.driverId = 'Please select a driver';
    if (!form.vehicleId) newErrors.vehicleId = 'Please select a vehicle';
    if (form.fuelVolumeAllocated <= 0) newErrors.fuelVolumeAllocated = 'Volume must be greater than 0';
    
    if (selectedVehicle && form.fuelVolumeAllocated > selectedVehicle.tankCapacity) {
      newErrors.fuelVolumeAllocated = 'Volume cannot exceed tank capacity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedDriver || !selectedVehicle) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const order = await placeOrder(form);
      if (order) {
        setSubmitted({ orderId: order.id });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="page">
        <div className="success-card">
          <CheckCircle2 size={56} className="success-icon" />
          <h2>Order Submitted Successfully!</h2>
          <p className="text-muted">
            Your fuel order has been sent to the OMC for approval.
          </p>

          <div className="info-box">
            <p><strong>Order ID:</strong> {submitted.orderId}</p>
            <p>The OMC will review and approve your order.</p>
            <p>Once approved, the driver will be able to <strong>generate an OTP</strong> from their portal.</p>
          </div>

          <div className="action-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/dashboard/orders')}>
              <Fuel size={18} />
              View My Orders
            </button>
            <button className="btn btn-outline" onClick={() => { setSubmitted(null); setForm({ siteId: '', driverId: '', vehicleId: '', fuelVolumeAllocated: 0, fuelType: 'Diesel' }); }}>
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1>New Fuel Order</h1>
          <p className="text-muted">Request fuel for a vehicle</p>
        </div>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        {/* Site Selection */}
        <div className="form-section">
          <h3><MapPin size={18} /> Station Site</h3>
          <div className="form-group">
            <label htmlFor="siteId">Select Fuel Station</label>
            <select
              id="siteId"
              value={form.siteId}
              onChange={e => updateField('siteId', e.target.value)}
              className={errors.siteId ? 'input-error' : ''}
            >
              <option value="">-- Select a station --</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
            {errors.siteId && <span className="field-error">{errors.siteId}</span>}
          </div>
        </div>

        {/* Driver Info */}
        <div className="form-section">
          <h3><User size={18} /> Driver Information</h3>
          <div className="form-group">
            <label htmlFor="driverId">Select Driver</label>
            <select
              id="driverId"
              value={form.driverId}
              onChange={e => updateField('driverId', e.target.value)}
              className={errors.driverId ? 'input-error' : ''}
            >
              <option value="">-- Select a driver --</option>
              {myDrivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
              ))}
            </select>
            {errors.driverId && <span className="field-error">{errors.driverId}</span>}
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="form-section">
          <h3><Car size={18} /> Vehicle Details</h3>
          <div className="form-group">
            <label htmlFor="vehicleId">Select Vehicle</label>
            <select
              id="vehicleId"
              value={form.vehicleId}
              onChange={e => updateField('vehicleId', e.target.value)}
              className={errors.vehicleId ? 'input-error' : ''}
            >
              <option value="">-- Select a vehicle --</option>
              {myVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.regNumber} - {v.type}</option>
              ))}
            </select>
            {errors.vehicleId && <span className="field-error">{errors.vehicleId}</span>}
          </div>
          
          {selectedVehicle && (
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Vehicle Type</label>
                <input type="text" value={selectedVehicle.type} disabled />
              </div>
              <div className="form-group">
                <label>Tank Capacity (Litres)</label>
                <input type="number" value={selectedVehicle.tankCapacity} disabled />
              </div>
            </div>
          )}
        </div>

        {/* Fuel Info */}
        <div className="form-section">
          <h3><Fuel size={18} /> Fuel Request</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fuelType">Fuel Type</label>
              <select
                id="fuelType"
                value={form.fuelType}
                onChange={e => updateField('fuelType', e.target.value as FuelType)}
              >
                {FUEL_TYPES.map(ft => (
                  <option key={ft} value={ft}>{ft}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="fuelVolumeAllocated"><Droplets size={14} /> Fuel Volume Allocated (Litres)</label>
              <input
                id="fuelVolumeAllocated"
                type="number"
                min={1}
                max={selectedVehicle?.tankCapacity || undefined}
                value={form.fuelVolumeAllocated || ''}
                onChange={e => updateField('fuelVolumeAllocated', Number(e.target.value))}
                placeholder="Enter fuel volume in litres"
                className={errors.fuelVolumeAllocated ? 'input-error' : ''}
              />
              {errors.fuelVolumeAllocated && <span className="field-error">{errors.fuelVolumeAllocated}</span>}
            </div>
          </div>
          {selectedVehicle && form.fuelVolumeAllocated > 0 && (
            <div className="fill-indicator">
              <div className="fill-bar">
                <div
                  className="fill-level"
                  style={{ width: `${Math.min((form.fuelVolumeAllocated / selectedVehicle.tankCapacity) * 100, 100)}%` }}
                />
              </div>
              <span>{Math.round((form.fuelVolumeAllocated / selectedVehicle.tankCapacity) * 100)}% of tank capacity</span>
            </div>
          )}
        </div>

        {submitError && (
          <div className="error-message" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            {submitError}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 size={20} className="animate-spin" /> Submitting...</>
          ) : (
            <><Send size={20} /> Submit Fuel Order</>
          )}
        </button>
      </form>
    </div>
  );
}
