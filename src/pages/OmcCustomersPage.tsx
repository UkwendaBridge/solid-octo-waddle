import { useState } from 'react';
import { useCustomers } from '../context/CustomerContext';
import PageToolbar from '../components/PageToolbar';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { Plus, Users, Pencil, Trash2, Check, X, Loader2, Mail, Phone, Lock, Building2 } from 'lucide-react';
import type { Customer } from '../types';

export default function OmcCustomersPage() {
  const { customers, isLoading, error, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const resetForm = () => {
    setNewName('');
    setNewCompany('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword('');
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
    setIsSaving(true);
    await addCustomer({
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      password: newPassword.trim(),
      companyName: newCompany.trim() || newName.trim(),
    });
    resetForm();
    setShowAddModal(false);
    setIsSaving(false);
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setEditData({ ...c });
  };

  const handleSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    await updateCustomer(editData.id, editData);
    setEditingId(null);
    setEditData(null);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    await deleteCustomer(id);
    setDeleteId(null);
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      search === '' ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q)
    );
  });

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filtered);

  if (isLoading && customers.length === 0) {
    return (
      <div className="page page-wide">
        <div className="empty-state">
          <Loader2 size={48} className="animate-spin" />
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Manage Customers</h1>
          <p className="text-muted">{customers.length} customers registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Search */}
      <PageToolbar 
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or company…"
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>No customers found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(c => {
                const isEditing = editingId === c.id;
                const row = isEditing && editData ? editData : c;
                return (
                  <tr key={c.id}>
                    <td className="cell-bold">
                      {isEditing ? <input className="cell-input" value={row.name} onChange={e => setEditData({ ...row, name: e.target.value })} /> : row.name}
                    </td>
                    <td>
                      {isEditing ? <input className="cell-input" value={row.companyName} onChange={e => setEditData({ ...row, companyName: e.target.value })} /> : row.companyName}
                    </td>
                    <td>
                      {isEditing ? <input className="cell-input" value={row.email} onChange={e => setEditData({ ...row, email: e.target.value })} /> : row.email}
                    </td>
                    <td>
                      {isEditing ? <input className="cell-input" value={row.phone} onChange={e => setEditData({ ...row, phone: e.target.value })} /> : row.phone}
                    </td>
                    <td>{new Date(row.createdAt).toLocaleDateString('en-ZA')}</td>
                    <td>
                      <div className="table-actions">
                        {isEditing ? (
                          <>
                            <button className="action-btn action-save" title="Save" aria-label="Save changes" onClick={handleSave} disabled={isSaving}>
                              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            </button>
                            <button className="action-btn action-cancel" title="Cancel" aria-label="Cancel editing" onClick={handleCancel}><X size={15} /></button>
                          </>
                        ) : (
                          <>
                            <button className="action-btn action-edit" title="Edit" aria-label={`Edit ${c.name}`} onClick={() => handleEdit(c)}><Pencil size={15} /></button>
                            <button className="action-btn action-delete" title="Delete" aria-label={`Delete ${c.name}`} onClick={() => setDeleteId(c.id)}><Trash2 size={15} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="add-customer-title">
            <div className="modal-header">
              <h2 id="add-customer-title">
                <Users size={20} style={{ marginRight: 8 }} />
                New Customer
              </h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)} aria-label="Close dialog">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label><Users size={14} /> Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label><Building2 size={14} /> Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Fleet Corp (optional)"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><Mail size={14} /> Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@fleet.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label><Phone size={14} /> Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+27 XX XXX XXXX"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label><Lock size={14} /> Password *</label>
                <input
                  type="password"
                  placeholder="Login password for customer portal"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { resetForm(); setShowAddModal(false); }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!newName.trim() || !newEmail.trim() || !newPassword.trim() || isSaving}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Create Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? All associated data will be lost. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
