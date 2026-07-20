import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDrivers } from '../context/DriverContext';
import { useVehicles } from '../context/VehicleContext';
import PageToolbar from '../components/PageToolbar';
import ConfirmDialog from '../components/ConfirmDialog';
import TableSkeleton from '../components/TableSkeleton';
import { Plus, Truck, Pencil, Trash2, Check, X, Car, Loader2 } from 'lucide-react';
import type { Driver } from '../types';

export default function DriverPage() {
  const { user } = useAuth();
  const { drivers, isLoading, error, addDriver, updateDriver, deleteDriver } = useDrivers();
  const { getVehiclesByDriver } = useVehicles();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Driver | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!user) return null;

  // Drivers are already filtered by backend for the logged-in customer
  const myDrivers = drivers;

  const handleAdd = async () => {
    if (!newName.trim() || !newPhone.trim() || !newPassword.trim()) return;
    setIsSaving(true);
    await addDriver({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      password: newPassword.trim(),
      customerId: user.id,
    });
    setNewName(''); setNewPhone(''); setNewEmail(''); setNewPassword('');
    setShowAdd(false);
    setIsSaving(false);
  };

  const handleEdit = (d: Driver) => {
    setEditingId(d.id);
    setEditData({ ...d });
  };

  const handleSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    await updateDriver(editData.id, editData);
    setEditingId(null);
    setEditData(null);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDriver(id);
    setDeleteId(null);
  };

  const filtered = myDrivers.filter(d => {
    const q = search.toLowerCase();
    return search === '' || d.name.toLowerCase().includes(q) || d.phone.includes(q) || (d.email || '').toLowerCase().includes(q);
  });

  if (isLoading && drivers.length === 0) {
    return (
      <div className="page page-wide">
        <div className="page-header"><h1>Manage Drivers</h1></div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Manage Drivers</h1>
          <p className="text-muted">{myDrivers.length} drivers registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} />
          Add Driver
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Add Driver Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="flex items-center gap-2 m-0 text-lg font-bold">
                <Plus size={20} style={{ color: 'var(--qb-green)' }} /> New Driver
              </h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" className="form-input" placeholder="e.g. Sipho Zulu" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" className="form-input" placeholder="+27 XX XXX XXXX" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" className="form-input" placeholder="Driver login password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email (Optional)</label>
                  <input type="email" className="form-input" placeholder="driver@company.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newName.trim() || !newPhone.trim() || !newPassword.trim() || isSaving}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Create Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <PageToolbar 
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, phone, or email…"
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Truck size={48} />
          <h3>No Drivers</h3>
          <p>Add your first driver to get started.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Assigned Vehicles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const isEditing = editingId === d.id;
                const row = isEditing && editData ? editData : d;
                const assignedVehicles = getVehiclesByDriver(d.id);

                return (
                  <tr key={d.id}>
                    <td className="cell-bold">
                      {isEditing ? <input className="cell-input" value={row.name} onChange={e => setEditData({ ...row, name: e.target.value })} /> : row.name}
                    </td>
                    <td>
                      {isEditing ? <input className="cell-input" value={row.phone} onChange={e => setEditData({ ...row, phone: e.target.value })} /> : row.phone}
                    </td>
                    <td>
                      {isEditing ? <input className="cell-input" value={row.email || ''} onChange={e => setEditData({ ...row, email: e.target.value })} /> : row.email || '—'}
                    </td>
                    <td>
                      {assignedVehicles.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {assignedVehicles.map(v => (
                            <span key={v.id} className="status-badge status-approved" style={{ fontSize: '0.7rem' }}>
                              <Car size={12} /> {v.regNumber}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        {isEditing ? (
                          <>
                            <button className="action-btn action-save" title="Save" onClick={handleSave} disabled={isSaving}>
                              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            </button>
                            <button className="action-btn action-cancel" title="Cancel" onClick={handleCancel}><X size={15} /></button>
                          </>
                        ) : (
                          <>
                            <button className="action-btn action-edit" title="Edit" onClick={() => handleEdit(d)}><Pencil size={15} /></button>
                            <button className="action-btn action-delete" title="Delete" onClick={() => setDeleteId(d.id)}><Trash2 size={15} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Driver"
        message="Are you sure you want to delete this driver? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
