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
  Users, Plus, Pencil, Trash2, Phone, MapPin,
  Calendar, Loader2, User, Hash,
} from 'lucide-react';

interface Attendant {
  id: string;
  name: string;
  phone: string;
  idNumber: string;
  stationId: string;
  stationName: string;
  shift: 'Day' | 'Night' | 'Rotating';
  hireDate: string;
  status: 'active' | 'inactive' | 'on-leave';
}

const MOCK_ATTENDANTS: Attendant[] = [
  {
    id: 'ATT-001',
    name: 'Sipho Mahlangu',
    phone: '072 345 6788',
    idNumber: '9001015800082',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    shift: 'Day',
    hireDate: '2024-06-15',
    status: 'active',
  },
  {
    id: 'ATT-002',
    name: 'Grace Dlamini',
    phone: '083 456 7890',
    idNumber: '9205025800083',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    shift: 'Night',
    hireDate: '2024-12-01',
    status: 'active',
  },
  {
    id: 'ATT-003',
    name: 'Peter Molefe',
    phone: '076 567 8901',
    idNumber: '8803015800084',
    stationId: 'STN-002',
    stationName: 'Caltex Rosebank',
    shift: 'Rotating',
    hireDate: '2023-11-20',
    status: 'active',
  },
  {
    id: 'ATT-004',
    name: 'Linda Nkosi',
    phone: '082 678 9012',
    idNumber: '9507025800085',
    stationId: 'STN-002',
    stationName: 'Caltex Rosebank',
    shift: 'Day',
    hireDate: '2025-01-10',
    status: 'on-leave',
  },
  {
    id: 'ATT-005',
    name: 'Thabo Zulu',
    phone: '079 789 0123',
    idNumber: '9108015800086',
    stationId: 'STN-003',
    stationName: 'Engen Melrose',
    shift: 'Day',
    hireDate: '2024-03-05',
    status: 'active',
  },
];

const EMPTY_ATTENDANT = { name: '', phone: '', idNumber: '', stationId: '', stationName: '', shift: 'Day' as Attendant['shift'] };
const SHIFT_CLASSES: Record<Attendant['shift'], string> = { Day: 'badge-day', Night: 'badge-night', Rotating: 'badge-rotating' };
const STATUS_CLASSES: Record<Attendant['status'], string> = { active: 'badge-active', inactive: 'badge-inactive', 'on-leave': 'badge-on-leave' };
const STATUS_LABELS: Record<Attendant['status'], string> = { active: 'Active', inactive: 'Inactive', 'on-leave': 'On Leave' };

export default function AttendantsPage() {
  const [attendants, setAttendants] = useState<Attendant[]>(MOCK_ATTENDANTS);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Attendant | null>(null);
  const [newAttendant, setNewAttendant] = useState(EMPTY_ATTENDANT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCount = attendants.filter(a => a.status === 'active').length;
  const onLeaveCount = attendants.filter(a => a.status === 'on-leave').length;

  const filteredAttendants = attendants.filter(a => {
    const q = search.toLowerCase();
    return search === '' || a.name.toLowerCase().includes(q) || a.stationName.toLowerCase().includes(q) || a.phone.includes(q);
  });

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredAttendants);

  const handleAdd = async () => {
    if (!newAttendant.name || !newAttendant.phone) return;
    setIsSubmitting(true);
    setAttendants([{ id: `ATT-${String(attendants.length + 1).padStart(3, '0')}`, ...newAttendant, hireDate: new Date().toISOString().split('T')[0], status: 'active' }, ...attendants]);
    setNewAttendant(EMPTY_ATTENDANT);
    setShowAddModal(false);
    setIsSubmitting(false);
  };

  const openEdit = (attendant: Attendant) => { setEditData({ ...attendant }); setShowEditModal(true); };

  const handleSave = async () => {
    if (!editData) return;
    setIsSubmitting(true);
    setAttendants(attendants.map(a => a.id === editData.id ? editData : a));
    setShowEditModal(false);
    setEditData(null);
    setIsSubmitting(false);
  };

  const confirmDelete = () => {
    if (deleteId) { setAttendants(attendants.filter(a => a.id !== deleteId)); setDeleteId(null); }
  };

  return (
    <div className="page page-wide">
      <DevBanner />
      <PageHeader
        title="Attendants"
        subtitle="Manage station attendants and staff"
        action={
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Attendant
          </button>
        }
      />

      <div className="stats-grid fade-in-up">
        <StatCard icon={<Users size={22} />} value={attendants.length} label="Total Attendants" color="blue" />
        <StatCard icon={<User size={22} />} value={activeCount} label="Active" color="green" />
        <StatCard icon={<Calendar size={22} />} value={onLeaveCount} label="On Leave" color="yellow" />
      </div>

      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search attendants by name, station or phone..."
      />

      {filteredAttendants.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          description={search ? `No attendants match "${search}"` : 'No attendants added yet.'}
        />
      ) : (
        <div className="table-card fade-in-up">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Attendant</th>
                  <th>Station</th>
                  <th>Phone</th>
                  <th>ID Number</th>
                  <th>Shift</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(att => (
                  <tr key={att.id}>
                    <td className="cell-mono">{att.id}</td>
                    <td>
                      <div className="cell-with-avatar">
                        <div className="cell-avatar">{att.name.charAt(0)}</div>
                        <span className="cell-bold">{att.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <MapPin size={12} className="cell-icon-muted" />
                        {att.stationName}
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <Phone size={12} className="cell-icon-muted" />
                        <span className="cell-muted">{att.phone}</span>
                      </div>
                    </td>
                    <td className="cell-mono cell-muted">{att.idNumber}</td>
                    <td><span className={`status-badge ${SHIFT_CLASSES[att.shift]}`}>{att.shift}</span></td>
                    <td className="cell-muted">{att.hireDate}</td>
                    <td><span className={`status-badge ${STATUS_CLASSES[att.status]}`}>{STATUS_LABELS[att.status]}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn action-edit" title={`Edit ${att.name}`} aria-label={`Edit ${att.name}`} onClick={() => openEdit(att)}>
                          <Pencil size={14} />
                        </button>
                        <button className="action-btn action-delete" title={`Delete ${att.name}`} aria-label={`Delete ${att.name}`} onClick={() => setDeleteId(att.id)}>
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

      {/* Add Attendant Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setNewAttendant(EMPTY_ATTENDANT); setShowAddModal(false); }}
        title={<span className="modal-title-with-icon"><Users size={18} /> Add Attendant</span>}
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setNewAttendant(EMPTY_ATTENDANT); setShowAddModal(false); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={!newAttendant.name || !newAttendant.phone || isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
              Add Attendant
            </button>
          </>
        }
      >
        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="att-name"><User size={13} /> Full Name <span className="field-required">*</span></label>
            <input id="att-name" type="text" placeholder="Enter full name" value={newAttendant.name} onChange={e => setNewAttendant({ ...newAttendant, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="att-phone"><Phone size={13} /> Phone <span className="field-required">*</span></label>
              <input id="att-phone" type="tel" placeholder="072 xxx xxxx" value={newAttendant.phone} onChange={e => setNewAttendant({ ...newAttendant, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="att-id"><Hash size={13} /> ID Number</label>
              <input id="att-id" type="text" placeholder="SA ID Number" value={newAttendant.idNumber} onChange={e => setNewAttendant({ ...newAttendant, idNumber: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="att-station"><MapPin size={13} /> Station</label>
              <input id="att-station" type="text" placeholder="Assign to station" value={newAttendant.stationName} onChange={e => setNewAttendant({ ...newAttendant, stationName: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="att-shift">Shift</label>
              <select id="att-shift" value={newAttendant.shift} onChange={e => setNewAttendant({ ...newAttendant, shift: e.target.value as Attendant['shift'] })}>
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
                <option value="Rotating">Rotating</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Attendant Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditData(null); }}
        title={<span className="modal-title-with-icon"><Pencil size={18} /> Edit Attendant</span>}
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowEditModal(false); setEditData(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!editData?.name || isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
              Save Changes
            </button>
          </>
        }
      >
        {editData && (
          <div className="modal-form">
            <div className="form-group">
              <label htmlFor="edit-att-name"><User size={13} /> Full Name</label>
              <input id="edit-att-name" type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-att-phone"><Phone size={13} /> Phone</label>
                <input id="edit-att-phone" type="tel" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-att-id"><Hash size={13} /> ID Number</label>
                <input id="edit-att-id" type="text" value={editData.idNumber} onChange={e => setEditData({ ...editData, idNumber: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-att-station"><MapPin size={13} /> Station</label>
                <input id="edit-att-station" type="text" value={editData.stationName} onChange={e => setEditData({ ...editData, stationName: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-att-shift">Shift</label>
                <select id="edit-att-shift" value={editData.shift} onChange={e => setEditData({ ...editData, shift: e.target.value as Attendant['shift'] })}>
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                  <option value="Rotating">Rotating</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="edit-att-status">Status</label>
              <select id="edit-att-status" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value as Attendant['status'] })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Attendant"
        message="Are you sure you want to delete this attendant? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
