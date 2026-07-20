import { useState } from 'react';
import DevBanner from '../components/DevBanner';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import PageToolbar from '../components/PageToolbar';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import {
  MapPin, Plus, Pencil, Trash2, Building2, Clock,
  Fuel, Loader2, Phone, User, Hash,
} from 'lucide-react';

interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  manager: string;
  operatingHours: string;
  pumps: number;
  tanks: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
}

const MOCK_STATIONS: Station[] = [
  {
    id: 'STN-001',
    name: 'Shell Sandton City',
    address: '123 Rivonia Road',
    city: 'Sandton',
    phone: '011 783 4521',
    manager: 'James Ndlovu',
    operatingHours: '24/7',
    pumps: 8,
    tanks: 4,
    status: 'active',
    createdAt: '2025-01-15',
  },
  {
    id: 'STN-002',
    name: 'Caltex Rosebank',
    address: '45 Oxford Road',
    city: 'Rosebank',
    phone: '011 447 8832',
    manager: 'Sarah Mokoena',
    operatingHours: '05:00 - 22:00',
    pumps: 6,
    tanks: 3,
    status: 'active',
    createdAt: '2025-02-20',
  },
  {
    id: 'STN-003',
    name: 'Engen Melrose',
    address: '78 Melrose Boulevard',
    city: 'Melrose',
    phone: '011 684 2210',
    manager: 'David van Wyk',
    operatingHours: '06:00 - 21:00',
    pumps: 4,
    tanks: 2,
    status: 'maintenance',
    createdAt: '2025-03-10',
  },
  {
    id: 'STN-004',
    name: 'BP Fourways',
    address: '256 William Nicol Drive',
    city: 'Fourways',
    phone: '011 467 9901',
    manager: 'Thabo Sithole',
    operatingHours: '24/7',
    pumps: 10,
    tanks: 5,
    status: 'active',
    createdAt: '2025-01-08',
  },
];

const EMPTY_STATION = { name: '', address: '', city: '', phone: '', manager: '', operatingHours: '24/7', pumps: 4, tanks: 2 };
const STATUS_LABELS: Record<Station['status'], string> = { active: 'Active', inactive: 'Inactive', maintenance: 'Maintenance' };
const STATUS_CLASSES: Record<Station['status'], string> = { active: 'badge-active', inactive: 'badge-inactive', maintenance: 'badge-maintenance' };

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>(MOCK_STATIONS);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Station | null>(null);
  const [newStation, setNewStation] = useState(EMPTY_STATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCount = stations.filter(s => s.status === 'active').length;
  const totalPumps = stations.reduce((sum, s) => sum + s.pumps, 0);

  const filteredStations = stations.filter(s => {
    const q = search.toLowerCase();
    return search === '' || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.manager.toLowerCase().includes(q);
  });

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredStations);

  const handleAdd = async () => {
    if (!newStation.name || !newStation.address) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    setStations([{ id: `STN-${String(stations.length + 1).padStart(3, '0')}`, ...newStation, status: 'active', createdAt: new Date().toISOString().split('T')[0] }, ...stations]);
    setNewStation(EMPTY_STATION);
    setShowAddModal(false);
    setIsSubmitting(false);
  };

  const openEdit = (station: Station) => { setEditData({ ...station }); setShowEditModal(true); };

  const handleSave = async () => {
    if (!editData) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    setStations(stations.map(s => s.id === editData.id ? editData : s));
    setShowEditModal(false);
    setEditData(null);
    setIsSubmitting(false);
  };

  const confirmDelete = () => {
    if (deleteId) { setStations(stations.filter(s => s.id !== deleteId)); setDeleteId(null); }
  };

  return (
    <div className="page page-wide">
      <DevBanner />
      <PageHeader
        title="Stations"
        subtitle="Manage fuel stations and locations"
        action={
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Station
          </button>
        }
      />

      <div className="stats-grid fade-in-up">
        <StatCard icon={<MapPin size={22} />} value={stations.length} label="Total Stations" color="blue" />
        <StatCard icon={<Building2 size={22} />} value={activeCount} label="Active" color="green" />
        <StatCard icon={<Fuel size={22} />} value={totalPumps} label="Total Pumps" color="purple" />
      </div>

      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search stations by name, city or manager..."
      />

      {filteredStations.length === 0 ? (
        <EmptyState
          icon={<MapPin size={48} />}
          description={search ? `No stations match "${search}"` : 'No stations added yet.'}
        />
      ) : (
        <div className="table-card fade-in-up">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Station Name</th>
                  <th>City</th>
                  <th>Manager</th>
                  <th>Phone</th>
                  <th>Hours</th>
                  <th>Pumps</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(station => (
                  <tr key={station.id}>
                    <td className="cell-mono">{station.id}</td>
                    <td>
                      <div className="cell-with-icon">
                        <MapPin size={13} className="cell-icon-muted" />
                        <span className="cell-bold">{station.name}</span>
                      </div>
                    </td>
                    <td>{station.city}</td>
                    <td>{station.manager}</td>
                    <td className="cell-muted">{station.phone}</td>
                    <td>
                      <div className="cell-with-icon">
                        <Clock size={12} className="cell-icon-muted" />
                        {station.operatingHours}
                      </div>
                    </td>
                    <td>{station.pumps} <span className="cell-sub">pumps</span></td>
                    <td>
                      <span className={`status-badge ${STATUS_CLASSES[station.status]}`}>
                        {STATUS_LABELS[station.status]}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn action-edit" title={`Edit ${station.name}`} aria-label={`Edit ${station.name}`} onClick={() => openEdit(station)}>
                          <Pencil size={14} />
                        </button>
                        <button className="action-btn action-delete" title={`Delete ${station.name}`} aria-label={`Delete ${station.name}`} onClick={() => setDeleteId(station.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={goToPage} />
        </div>
      )}

      {/* Add Station Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setNewStation(EMPTY_STATION); setShowAddModal(false); }}
        title={<span className="modal-title-with-icon"><MapPin size={18} /> Add Station</span>}
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setNewStation(EMPTY_STATION); setShowAddModal(false); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={!newStation.name || !newStation.address || isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              Add Station
            </button>
          </>
        }
      >
        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="stn-name"><Building2 size={13} /> Station Name <span className="field-required">*</span></label>
            <input id="stn-name" type="text" placeholder="e.g. Shell Sandton City" value={newStation.name} onChange={e => setNewStation({ ...newStation, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stn-address"><MapPin size={13} /> Address <span className="field-required">*</span></label>
              <input id="stn-address" type="text" placeholder="e.g. 123 Rivonia Road" value={newStation.address} onChange={e => setNewStation({ ...newStation, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="stn-city">City</label>
              <input id="stn-city" type="text" placeholder="e.g. Sandton" value={newStation.city} onChange={e => setNewStation({ ...newStation, city: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stn-manager"><User size={13} /> Manager</label>
              <input id="stn-manager" type="text" placeholder="Manager name" value={newStation.manager} onChange={e => setNewStation({ ...newStation, manager: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="stn-phone"><Phone size={13} /> Phone</label>
              <input id="stn-phone" type="tel" placeholder="011 000 0000" value={newStation.phone} onChange={e => setNewStation({ ...newStation, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stn-hours"><Clock size={13} /> Operating Hours</label>
              <input id="stn-hours" type="text" placeholder="e.g. 24/7" value={newStation.operatingHours} onChange={e => setNewStation({ ...newStation, operatingHours: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="stn-pumps"><Hash size={13} /> Pumps</label>
              <input id="stn-pumps" type="number" min={1} value={newStation.pumps} onChange={e => setNewStation({ ...newStation, pumps: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Station Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditData(null); }}
        title={<span className="modal-title-with-icon"><Pencil size={18} /> Edit Station</span>}
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowEditModal(false); setEditData(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!editData?.name || isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              Save Changes
            </button>
          </>
        }
      >
        {editData && (
          <div className="modal-form">
            <div className="form-group">
              <label htmlFor="edit-stn-name"><Building2 size={13} /> Station Name</label>
              <input id="edit-stn-name" type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-stn-address"><MapPin size={13} /> Address</label>
                <input id="edit-stn-address" type="text" value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-stn-city">City</label>
                <input id="edit-stn-city" type="text" value={editData.city} onChange={e => setEditData({ ...editData, city: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-stn-manager"><User size={13} /> Manager</label>
                <input id="edit-stn-manager" type="text" value={editData.manager} onChange={e => setEditData({ ...editData, manager: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-stn-phone"><Phone size={13} /> Phone</label>
                <input id="edit-stn-phone" type="tel" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-stn-hours"><Clock size={13} /> Operating Hours</label>
                <input id="edit-stn-hours" type="text" value={editData.operatingHours} onChange={e => setEditData({ ...editData, operatingHours: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-stn-status">Status</label>
                <select id="edit-stn-status" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value as Station['status'] })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Station"
        message="Are you sure you want to delete this station? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
