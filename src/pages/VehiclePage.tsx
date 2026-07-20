import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { useDrivers } from '../context/DriverContext';
import PageToolbar from '../components/PageToolbar';
import ConfirmDialog from '../components/ConfirmDialog';
import TableSkeleton from '../components/TableSkeleton';
import { Plus, Car, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import type { Vehicle, VehicleType } from '../types';

const VEHICLE_TYPES: VehicleType[] = ['Sedan', 'SUV', 'Truck', 'Bus', 'Motorcycle', 'Van', 'Tanker', 'Pickup', 'Other'];

export default function VehiclePage() {
  const { user } = useAuth();
  const { vehicles, isLoading, error, addVehicle, updateVehicle, deleteVehicle, assignVehicleToDriver, unassignVehicle } = useVehicles();
  const { drivers } = useDrivers();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Vehicle | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newRegNumber, setNewRegNumber] = useState('');
  const [newType, setNewType] = useState<VehicleType>('Truck');
  const [newTankCapacity, setNewTankCapacity] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!user) return null;

  // Vehicles and drivers are already filtered by backend for the logged-in customer
  const myVehicles = vehicles;
  const myDrivers = drivers;

  const handleAdd = async () => {
    if (!newRegNumber.trim()) return;
    setIsSaving(true);
    await addVehicle({
      regNumber: newRegNumber.trim(),
      type: newType,
      tankCapacity: newTankCapacity,
      customerId: user.id,
    });
    setNewRegNumber(''); setNewType('Truck'); setNewTankCapacity(0);
    setShowAdd(false);
    setIsSaving(false);
  };

  const handleEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setEditData({ ...v });
  };

  const handleSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    await updateVehicle(editData.id, {
      regNumber: editData.regNumber,
      type: editData.type,
      tankCapacity: editData.tankCapacity || 0,
      assignedDriverId: editData.assignedDriverId,
    });
    setEditingId(null);
    setEditData(null);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDriverAssign = async (vehicleId: string, driverId: string) => {
    if (driverId === '') {
      await unassignVehicle(vehicleId);
    } else {
      await assignVehicleToDriver(vehicleId, driverId);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteVehicle(id);
    setDeleteId(null);
  };

  const filtered = myVehicles.filter(v => {
    const q = search.toLowerCase();
    return search === '' || v.regNumber.toLowerCase().includes(q) || v.type.toLowerCase().includes(q);
  });

  if (isLoading && vehicles.length === 0) {
    return (
      <div className="page page-wide">
        <div className="page-header"><h1>Manage Vehicles</h1></div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Manage Vehicles</h1>
          <p className="text-muted">{myVehicles.length} vehicles registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Add Vehicle Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="flex items-center gap-2 m-0 text-lg font-bold">
                <Plus size={20} style={{ color: 'var(--qb-green)' }} /> New Vehicle
              </h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Registration Number</label>
                  <input type="text" className="form-input" placeholder="e.g. GP-123-456" value={newRegNumber} onChange={e => setNewRegNumber(e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select className="form-select" value={newType} onChange={e => setNewType(e.target.value as VehicleType)}>
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tank Capacity (Litres)</label>
                <input type="number" className="form-input" min={1} placeholder="e.g. 80" value={newTankCapacity || ''} onChange={e => setNewTankCapacity(Number(e.target.value))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newRegNumber.trim() || isSaving}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Create Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <PageToolbar 
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by reg number or type…"
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Car size={48} />
          <h3>No Vehicles</h3>
          <p>Add your first vehicle to get started.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reg Number</th>
                <th>Type</th>
                <th>Tank Capacity</th>
                <th>Assigned Driver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const isEditing = editingId === v.id;
                const row = isEditing && editData ? editData : v;

                return (
                  <tr key={v.id}>
                    <td className="cell-bold">
                      {isEditing
                        ? <input className="cell-input" value={row.regNumber} onChange={e => setEditData({ ...row, regNumber: e.target.value })} />
                        : row.regNumber}
                    </td>
                    <td>
                      {isEditing ? (
                        <select className="cell-input" value={row.type} onChange={e => setEditData({ ...row, type: e.target.value as VehicleType })}>
                          {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : row.type}
                    </td>
                    <td>
                      {isEditing
                        ? <input className="cell-input cell-input-sm" type="number" value={row.tankCapacity} onChange={e => setEditData({ ...row, tankCapacity: Number(e.target.value) })} />
                        : `${row.tankCapacity} L`}
                    </td>
                    <td>
                      <select
                        className="cell-input"
                        value={v.assignedDriverId || ''}
                        onChange={e => handleDriverAssign(v.id, e.target.value)}
                      >
                        <option value="">— Unassigned —</option>
                        {myDrivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
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
                            <button className="action-btn action-edit" title="Edit" onClick={() => handleEdit(v)}><Pencil size={15} /></button>
                            <button className="action-btn action-delete" title="Delete" onClick={() => setDeleteId(v.id)}><Trash2 size={15} /></button>
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
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
