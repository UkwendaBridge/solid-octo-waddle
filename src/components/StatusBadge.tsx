import {
  Clock,
  CheckCircle2,
  XCircle,
  Droplets,
} from 'lucide-react';
import type { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus | string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  draft:      { label: 'Draft',            className: 'status-draft',      icon: <Clock size={12} /> },
  sent:       { label: 'Pending Approval', className: 'status-pending',    icon: <Clock size={12} /> },
  pending:    { label: 'Pending Approval', className: 'status-pending',    icon: <Clock size={12} /> },
  approved:   { label: 'Approved',         className: 'status-approved',   icon: <CheckCircle2 size={12} /> },
  rejected:   { label: 'Rejected',         className: 'status-rejected',   icon: <XCircle size={12} /> },
  dispensing: { label: 'Dispensing',       className: 'status-dispensing', icon: <Droplets size={12} /> },
  completed:  { label: 'Completed',        className: 'status-completed',  icon: <CheckCircle2 size={12} /> },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'status-pending', icon: <Clock size={12} /> };

  return (
    <span className={`status-badge ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
