import { useState } from 'react';
import { formatDate } from '../utils/format';
import DevBanner from '../components/DevBanner';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import {
  Calendar, Plus, Clock, Trash2, Check,
  MapPin, Loader2, Pause, Fuel, AlertCircle,
} from 'lucide-react';

interface ScheduledPrice {
  id: string;
  stationId: string;
  stationName: string;
  fuelType: string;
  newPrice: number;
  effectiveDate: string;
  effectiveTime: string;
  status: 'scheduled' | 'applied' | 'cancelled';
  createdAt: string;
}

const MOCK_SCHEDULED: ScheduledPrice[] = [
  {
    id: 'sched-001',
    stationId: 'ALL',
    stationName: 'All Stations',
    fuelType: 'Petrol 95',
    newPrice: 25.50,
    effectiveDate: '2026-04-02',
    effectiveTime: '00:00',
    status: 'scheduled',
    createdAt: '2026-03-10',
  },
  {
    id: 'sched-002',
    stationId: 'ALL',
    stationName: 'All Stations',
    fuelType: 'Diesel 50ppm',
    newPrice: 24.20,
    effectiveDate: '2026-04-02',
    effectiveTime: '00:00',
    status: 'scheduled',
    createdAt: '2026-03-10',
  },
  {
    id: 'sched-003',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    fuelType: 'Petrol 95',
    newPrice: 24.95,
    effectiveDate: '2026-03-15',
    effectiveTime: '06:00',
    status: 'scheduled',
    createdAt: '2026-03-08',
  },
  {
    id: 'sched-004',
    stationId: 'ALL',
    stationName: 'All Stations',
    fuelType: 'Petrol 93',
    newPrice: 24.50,
    effectiveDate: '2026-03-01',
    effectiveTime: '00:00',
    status: 'applied',
    createdAt: '2026-02-25',
  },
];

const STATIONS = [
  { id: 'ALL', name: 'All Stations' },
  { id: 'STN-001', name: 'Shell Sandton City' },
  { id: 'STN-002', name: 'Caltex Rosebank' },
  { id: 'STN-003', name: 'Engen Melrose' },
];

const FUEL_TYPES = ['Petrol 95', 'Petrol 93', 'Diesel 50ppm', 'Diesel 500ppm'];

export default function PriceSchedulerPage() {
  const [scheduled, setScheduled] = useState<ScheduledPrice[]>(MOCK_SCHEDULED);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStation, setFilterStation] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'applied' | 'cancelled'>('all');

  const [newSchedule, setNewSchedule] = useState({
    stationId: 'ALL',
    fuelType: 'Petrol 95',
    newPrice: '',
    effectiveDate: '',
    effectiveTime: '00:00',
  });

  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'delete'; id: string } | null>(null);

  const pendingCount = scheduled.filter(s => s.status === 'scheduled').length;

  // Filter scheduled prices
  const filteredScheduled = scheduled.filter(item => {
    const matchesStation = filterStation === 'ALL' || item.stationId === filterStation || item.stationId === 'ALL';
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesStation && matchesStatus;
  });

  const handleAdd = async () => {
    if (!newSchedule.newPrice || !newSchedule.effectiveDate) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const station = STATIONS.find(s => s.id === newSchedule.stationId);
    const entry: ScheduledPrice = {
      id: `sched-${Date.now()}`,
      stationId: newSchedule.stationId,
      stationName: station?.name || '',
      fuelType: newSchedule.fuelType,
      newPrice: parseFloat(newSchedule.newPrice),
      effectiveDate: newSchedule.effectiveDate,
      effectiveTime: newSchedule.effectiveTime,
      status: 'scheduled',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setScheduled([entry, ...scheduled]);
    setNewSchedule({
      stationId: 'ALL',
      fuelType: 'Petrol 95',
      newPrice: '',
      effectiveDate: '',
      effectiveTime: '00:00',
    });
    setShowAddModal(false);
    setIsSubmitting(false);
  };

  const handleCancelClick = (id: string) => {
    setConfirmAction({ type: 'cancel', id });
  };

  const handleDeleteClick = (id: string) => {
    setConfirmAction({ type: 'delete', id });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'cancel') {
      setScheduled(scheduled.map(s => 
        s.id === confirmAction.id ? { ...s, status: 'cancelled' as const } : s
      ));
    } else {
      setScheduled(scheduled.filter(s => s.id !== confirmAction.id));
    }
    setConfirmAction(null);
  };


  const getStatusBadge = (status: ScheduledPrice['status']) => {
    switch (status) {
      case 'scheduled': return <span className="status-badge badge-scheduled"><Clock size={11} /> Scheduled</span>;
      case 'applied': return <span className="status-badge badge-applied"><Check size={11} /> Applied</span>;
      case 'cancelled': return <span className="status-badge badge-cancelled">Cancelled</span>;
    }
  };

  return (
    <div className="page page-wide">
      <DevBanner />
      <PageHeader
        title="Price Scheduler"
        subtitle="Schedule future fuel price changes"
        action={
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Schedule Price Change
          </button>
        }
      />

      <div className="stats-grid fade-in-up">
        <StatCard icon={<Clock size={22} />} value={pendingCount} label="Pending Changes" color="yellow" />
        <StatCard icon={<Check size={22} />} value={scheduled.filter(s => s.status === 'applied').length} label="Applied" color="green" />
        <StatCard icon={<Calendar size={22} />} value={scheduled.length} label="Total Scheduled" color="blue" />
      </div>

      <div className="sched-filter-bar">
        <div className="filter-group">
          <MapPin size={14} className="cell-icon-muted" />
          <select value={filterStation} onChange={e => setFilterStation(e.target.value)} className="filter-select-inline">
            {STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="tab-filters" style={{ marginBottom: 0 }}>
          <button className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All</button>
          <button className={`tab-btn ${filterStatus === 'scheduled' ? 'active' : ''}`} onClick={() => setFilterStatus('scheduled')}>Scheduled</button>
          <button className={`tab-btn ${filterStatus === 'applied' ? 'active' : ''}`} onClick={() => setFilterStatus('applied')}>Applied</button>
          <button className={`tab-btn ${filterStatus === 'cancelled' ? 'active' : ''}`} onClick={() => setFilterStatus('cancelled')}>Cancelled</button>
        </div>
      </div>

      {/* Scheduled List */}
      <div className="table-card fade-in-up">
        <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Effective Date</th>
              <th>Time</th>
              <th>Station</th>
              <th>Fuel Type</th>
              <th>New Price</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredScheduled.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No scheduled price changes found
                </td>
              </tr>
            ) : (
              filteredScheduled.map(item => (
                <tr key={item.id}>
                  <td className="cell-bold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      {formatDate(item.effectiveDate)}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {item.effectiveTime}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      {item.stationName}
                    </div>
                  </td>
                  <td>
                    <span className={`fuel-badge fuel-${item.fuelType.toLowerCase().includes('petrol') ? 'petrol' : 'diesel'}`}>
                      {item.fuelType}
                    </span>
                  </td>
                  <td className="cell-bold" style={{ color: 'var(--success)' }}>
                    R {item.newPrice.toFixed(2)}
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td className="text-muted">{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      {item.status === 'scheduled' && (
                        <button
                          className="action-btn action-cancel"
                          title="Cancel"
                          onClick={() => handleCancelClick(item.id)}
                        >
                          <Pause size={16} />
                        </button>
                      )}
                      <button
                        className="action-btn action-delete"
                        title="Delete"
                        onClick={() => handleDeleteClick(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={<span className="modal-title-with-icon"><Calendar size={18} /> Schedule Price Change</span>}
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={isSubmitting || !newSchedule.newPrice || !newSchedule.effectiveDate}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
              {isSubmitting ? 'Scheduling...' : 'Schedule Change'}
            </button>
          </>
        }
      >
        <div className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sched-station"><MapPin size={13} /> Station</label>
              <select id="sched-station" value={newSchedule.stationId} onChange={e => setNewSchedule({ ...newSchedule, stationId: e.target.value })}>
                {STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sched-fuel"><Fuel size={13} /> Fuel Type</label>
              <select id="sched-fuel" value={newSchedule.fuelType} onChange={e => setNewSchedule({ ...newSchedule, fuelType: e.target.value })}>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="sched-price">New Price (R/L) <span className="field-required">*</span></label>
            <input id="sched-price" type="number" step="0.01" min="0" placeholder="e.g. 25.50" value={newSchedule.newPrice} onChange={e => setNewSchedule({ ...newSchedule, newPrice: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sched-date"><Calendar size={13} /> Effective Date <span className="field-required">*</span></label>
              <input id="sched-date" type="date" value={newSchedule.effectiveDate} onChange={e => setNewSchedule({ ...newSchedule, effectiveDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="sched-time"><Clock size={13} /> Time</label>
              <input id="sched-time" type="time" value={newSchedule.effectiveTime} onChange={e => setNewSchedule({ ...newSchedule, effectiveTime: e.target.value })} />
            </div>
          </div>
          <div className="form-info-banner">
            <AlertCircle size={15} />
            Price changes will be automatically applied at the scheduled time.
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === 'cancel' ? 'Cancel Scheduled Change' : 'Delete Entry'}
        message={confirmAction?.type === 'cancel'
          ? 'Are you sure you want to cancel this scheduled price change?'
          : 'Are you sure you want to delete this scheduled entry? This cannot be undone.'}
        confirmLabel={confirmAction?.type === 'cancel' ? 'Cancel Change' : 'Delete'}
        variant={confirmAction?.type === 'delete' ? 'danger' : 'warning'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
