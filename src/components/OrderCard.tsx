import type { FuelOrder } from '../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Fuel,
  MapPin,
  User,
  Phone,
  Car,
  Hash,
  Droplets,
  KeyRound,
} from 'lucide-react';

interface Props {
  order: FuelOrder;
  showOtp?: boolean;
  actions?: React.ReactNode;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  draft:      { label: 'Draft',            className: 'status-draft',     icon: <Clock size={14} /> },
  sent:       { label: 'Pending Approval', className: 'status-pending',   icon: <Clock size={14} /> },
  pending:    { label: 'Pending Approval', className: 'status-pending',   icon: <Clock size={14} /> },
  approved:   { label: 'Approved',         className: 'status-approved',  icon: <CheckCircle2 size={14} /> },
  rejected:   { label: 'Rejected',         className: 'status-rejected',  icon: <XCircle size={14} /> },
  dispensing: { label: 'Dispensing',       className: 'status-dispensing',icon: <Droplets size={14} /> },
  completed:  { label: 'Completed',        className: 'status-completed', icon: <CheckCircle2 size={14} /> },
};

export default function OrderCard({ order, showOtp = false, actions }: Props) {
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div>
          <span className="order-id">{order.id}</span>
          <span className={`status-badge ${statusCfg.className}`}>
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>
        <span className="order-date">
          {new Date(order.createdAt).toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>

      <div className="order-card-body">
        <div className="order-detail-grid">
          <div className="detail-item">
            <MapPin size={15} className="detail-icon" />
            <div>
              <span className="detail-label">Site ID</span>
              <span className="detail-value">{order.siteId}</span>
            </div>
          </div>

          <div className="detail-item">
            <User size={15} className="detail-icon" />
            <div>
              <span className="detail-label">Driver</span>
              <span className="detail-value">{order.driverName}</span>
            </div>
          </div>

          <div className="detail-item">
            <Phone size={15} className="detail-icon" />
            <div>
              <span className="detail-label">Driver Phone</span>
              <span className="detail-value">{order.driverPhone}</span>
            </div>
          </div>

          <div className="detail-item">
            <Hash size={15} className="detail-icon" />
            <div>
              <span className="detail-label">Vehicle Reg</span>
              <span className="detail-value">{order.vehicleRegNumber}</span>
            </div>
          </div>

          <div className="detail-item">
            <Car size={15} className="detail-icon" />
            <div>
              <span className="detail-label">Vehicle Type</span>
              <span className="detail-value">{order.vehicleType}</span>
            </div>
          </div>

          <div className="detail-item">
            <Truck size={15} className="detail-icon" />
            <div>
              <span className="detail-label">Tank Capacity</span>
              <span className="detail-value">{order.tankCapacity} L</span>
            </div>
          </div>

          <div className="detail-item">
            <Fuel size={15} className="detail-icon" />
            <div>
              <span className="detail-label">Fuel Type</span>
              <span className="detail-value">{order.fuelType}</span>
            </div>
          </div>

          <div className="detail-item">
            <Droplets size={15} className="detail-icon" />
            <div>
              {/*
                Once fuel has been drawn, REMAINING is the number that matters —
                an allocation stays open across partial fills, so showing only
                the original volume tells a driver who has taken 2 of 5 L that
                they still have 5.
              */}
              <span className="detail-label">
                {order.fuelVolumeDrawn > 0 ? 'Remaining' : 'Volume Allocated'}
              </span>
              <span className="detail-value highlight">
                {order.fuelVolumeDrawn > 0
                  ? `${order.fuelVolumeRemaining} L`
                  : `${order.fuelVolumeAllocated} L`}
              </span>
              {order.fuelVolumeDrawn > 0 && (
                <span className="detail-subvalue">
                  {order.fuelVolumeDrawn} L of {order.fuelVolumeAllocated} L drawn
                </span>
              )}
            </div>
          </div>
        </div>

        {showOtp && (
          <div className={`otp-section ${order.otpActive ? 'otp-active' : 'otp-inactive'}`}>
            <KeyRound size={18} />
            <div>
              <span className="otp-label">OTP Code</span>
              <span className="otp-value">{order.otp}</span>
            </div>
            <span className={`otp-status ${order.otpActive ? 'active' : ''}`}>
              {order.otpActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        )}

        {order.status === 'rejected' && order.rejectionReason && (
          <div className="rejection-reason">
            <XCircle size={15} />
            <span>Reason: {order.rejectionReason}</span>
          </div>
        )}
      </div>

      {actions && <div className="order-card-actions">{actions}</div>}
    </div>
  );
}
