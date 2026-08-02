import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, Loader2, TableProperties, AlertCircle, X, Pencil, KeyRound, Trash2, Check } from 'lucide-react';
import PageToolbar from '../components/PageToolbar';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePagination } from '../hooks/usePagination';
import { useToast } from '../context/ToastContext';
import { omcCustomers, omcOrders, omcDebtors, omcBalance } from '../services/api';

type Row = Record<string, unknown>;

interface CustomerOption {
  id: string;
  label: string;
}

interface TableSource {
  key: string;
  label: string;
  /**
   * When true, this "table" only exists per customer, so a customer must be
   * picked before rows can be loaded (the backend has no global endpoint).
   */
  requiresCustomer?: boolean;
  /** Fetches rows. `customerId` is only supplied for customer-scoped tables. */
  load: (customerId?: string) => Promise<{ rows: Row[]; error?: string }>;
}

// Each entry maps a backend endpoint to a flat list of rows the grid can render.
const TABLES: TableSource[] = [
  {
    key: 'customers',
    label: 'Customers',
    load: async () => {
      const res = await omcCustomers.getAll();
      if (!res.success) return { rows: [], error: res.error || 'Failed to load customers' };
      return { rows: (res.data?.customers ?? []) as unknown as Row[] };
    },
  },
  {
    key: 'orders',
    label: 'Orders',
    load: async () => {
      const res = await omcOrders.getAll();
      if (!res.success) return { rows: [], error: res.error || 'Failed to load orders' };
      return { rows: (res.data?.orders ?? []) as unknown as Row[] };
    },
  },
  {
    key: 'debtors',
    label: 'Debtors',
    load: async () => {
      const res = await omcDebtors.getAll();
      if (!res.success) return { rows: [], error: res.error || 'Failed to load debtors' };
      return { rows: (res.data ?? []) as unknown as Row[] };
    },
  },
  {
    key: 'balances',
    label: 'Balances',
    load: async () => {
      const res = await omcBalance.getAll();
      if (!res.success) return { rows: [], error: res.error || 'Failed to load balances' };
      return { rows: (res.data?.customers ?? []) as unknown as Row[] };
    },
  },
  {
    key: 'drivers',
    label: 'Drivers',
    requiresCustomer: true,
    load: async customerId => {
      if (!customerId) return { rows: [] };
      const res = await omcCustomers.getDrivers(customerId);
      if (!res.success) return { rows: [], error: res.error || 'Failed to load drivers' };
      return { rows: (res.data?.drivers ?? []) as unknown as Row[] };
    },
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    requiresCustomer: true,
    load: async customerId => {
      if (!customerId) return { rows: [] };
      const res = await omcCustomers.getVehicles(customerId);
      if (!res.success) return { rows: [], error: res.error || 'Failed to load vehicles' };
      return { rows: (res.data?.vehicles ?? []) as unknown as Row[] };
    },
  },
];

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** A completed order is a finished transaction and must not be modified. */
function isCompletedOrder(row: Row): boolean {
  return String(row.status ?? '').toLowerCase() === 'completed';
}

export default function DataExplorerPage() {
  const toast = useToast();
  const [activeKey, setActiveKey] = useState(TABLES[0].key);
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Order action state (Orders table only).
  const [editOrder, setEditOrder] = useState<Row | null>(null);
  const [editFuel, setEditFuel] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

  const activeTable = useMemo(() => TABLES.find(t => t.key === activeKey) ?? TABLES[0], [activeKey]);
  const isOrders = activeKey === 'orders';

  // Customer picker options — loaded once and reused by the scoped tables.
  useEffect(() => {
    let cancelled = false;
    omcCustomers.getAll().then(res => {
      if (cancelled || !res.success) return;
      setCustomerOptions(
        (res.data?.customers ?? []).map(c => ({
          id: c.id,
          label: c.company_name ? `${c.name} — ${c.company_name}` : c.name,
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchRows = useCallback(async () => {
    // Scoped tables can't load until a customer is chosen.
    if (activeTable.requiresCustomer && !selectedCustomerId) {
      setRows([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { rows: data, error: err } = await activeTable.load(selectedCustomerId || undefined);
    setRows(data);
    setError(err ?? null);
    setIsLoading(false);
  }, [activeTable, selectedCustomerId]);

  useEffect(() => {
    setSearch('');
    setSelectedRow(null);
    fetchRows();
  }, [fetchRows]);

  const openEditOrder = (row: Row) => {
    setEditOrder(row);
    setEditFuel(String(row.requested_fuel ?? ''));
    setEditGrade(String(row.fuel_grade ?? ''));
    setEditDestination(row.destination == null ? '' : String(row.destination));
  };

  const saveEditOrder = async () => {
    if (!editOrder) return;
    const id = String(editOrder.id);
    setIsSaving(true);
    const fuel = parseFloat(editFuel);
    const res = await omcOrders.update(id, {
      requested_fuel: Number.isFinite(fuel) ? fuel : undefined,
      fuel_grade: editGrade.trim() || undefined,
      destination: editDestination.trim(),
    });
    setIsSaving(false);
    if (res.success) {
      toast.success('Order updated');
      setEditOrder(null);
      fetchRows();
    } else {
      toast.error(res.error || 'Failed to update order');
    }
  };

  const regenerateOtp = async (row: Row) => {
    const id = String(row.id);
    setBusyOrderId(id);
    const res = await omcOrders.regenerateOtp(id);
    setBusyOrderId(null);
    if (res.success) {
      toast.success('OTP regenerated');
      fetchRows();
    } else {
      toast.error(res.error || 'Failed to regenerate OTP');
    }
  };

  const confirmDeleteOrder = async () => {
    if (!deleteOrderId) return;
    const id = deleteOrderId;
    setBusyOrderId(id);
    const res = await omcOrders.delete(id);
    setBusyOrderId(null);
    setDeleteOrderId(null);
    if (res.success) {
      toast.success('Order deleted');
      fetchRows();
    } else {
      toast.error(res.error || 'Failed to delete order');
    }
  };

  // Column set is the union of keys across every row, preserving first-seen order.
  const columns = useMemo(() => {
    const seen: string[] = [];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!seen.includes(key)) seen.push(key);
      }
    }
    return seen;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row =>
      columns.some(col => formatCell(row[col]).toLowerCase().includes(q)),
    );
  }, [rows, columns, search]);

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filtered);

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>
            <Database size={22} style={{ marginRight: 8, verticalAlign: '-4px' }} />
            Database Explorer
          </h1>
          <p className="text-muted">Browse the backend data tables and their records.</p>
        </div>
        <button className="btn btn-outline" onClick={fetchRows} disabled={isLoading}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {/* Table selector */}
      <div className="tab-filters" role="tablist" aria-label="Data tables">
        {TABLES.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === activeKey}
            className={`tab-btn ${t.key === activeKey ? 'active' : ''}`}
            onClick={() => setActiveKey(t.key)}
          >
            <TableProperties size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${activeTable.label.toLowerCase()}…`}
      />

      {activeTable.requiresCustomer && (
        <div className="form-group" style={{ maxWidth: 420, marginBottom: '1rem' }}>
          <label htmlFor="data-customer-picker">Customer</label>
          <select
            id="data-customer-picker"
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
          >
            <option value="">Select a customer…</option>
            {customerOptions.map(o => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="form-error" role="alert" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} style={{ marginRight: 6, verticalAlign: '-3px' }} />
          {error}
        </div>
      )}

      {isLoading && rows.length === 0 ? (
        <div className="empty-state">
          <Loader2 size={48} className="animate-spin" />
          <p>Loading {activeTable.label.toLowerCase()}…</p>
        </div>
      ) : activeTable.requiresCustomer && !selectedCustomerId ? (
        <div className="empty-state">
          <Database size={48} />
          <p>Select a customer to view their {activeTable.label.toLowerCase()}.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Database size={48} />
          <p>No records found in {activeTable.label.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table explorer-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col}>{col}</th>
                ))}
                {isOrders && <th className="col-actions">actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((row, i) => {
                const completed = isOrders && isCompletedOrder(row);
                const rowId = String(row.id ?? '');
                const busy = busyOrderId === rowId;
                return (
                  <tr
                    key={rowId || i}
                    className="row-clickable"
                    onClick={() => setSelectedRow(row)}
                    title="Click to view full record"
                  >
                    {columns.map(col => (
                      <td key={col} title={formatCell(row[col])}>
                        {formatCell(row[col])}
                      </td>
                    ))}
                    {isOrders && (
                      <td className="col-actions" onClick={e => e.stopPropagation()}>
                        <div className="table-actions">
                          <button
                            className="action-btn action-edit"
                            title={completed ? 'Completed orders cannot be edited' : 'Edit order'}
                            aria-label="Edit order"
                            onClick={() => openEditOrder(row)}
                            disabled={completed || busy}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="action-btn"
                            title={completed ? 'Completed orders cannot be modified' : 'Regenerate OTP'}
                            aria-label="Regenerate OTP"
                            onClick={() => regenerateOtp(row)}
                            disabled={completed || busy}
                          >
                            {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                          </button>
                          <button
                            className="action-btn action-delete"
                            title={completed ? 'Completed orders cannot be deleted' : 'Delete order'}
                            aria-label="Delete order"
                            onClick={() => setDeleteOrderId(rowId)}
                            disabled={completed || busy}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
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

      {/* Row detail */}
      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="row-detail-title"
          >
            <div className="modal-header">
              <h2 id="row-detail-title">
                <TableProperties size={20} style={{ marginRight: 8, verticalAlign: '-4px' }} />
                {activeTable.label} record
              </h2>
              <button className="modal-close" onClick={() => setSelectedRow(null)} aria-label="Close dialog">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <table className="data-table">
                <tbody>
                  {Object.keys(selectedRow).map(key => (
                    <tr key={key}>
                      <td className="cell-bold" style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{key}</td>
                      <td style={{ wordBreak: 'break-word' }}>{formatCell(selectedRow[key])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isOrders && (
              <div className="modal-footer">
                {isCompletedOrder(selectedRow) ? (
                  <span className="text-muted">Completed orders cannot be modified.</span>
                ) : (
                  <>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        openEditOrder(selectedRow);
                        setSelectedRow(null);
                      }}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => regenerateOtp(selectedRow)}
                      disabled={busyOrderId === String(selectedRow.id)}
                    >
                      {busyOrderId === String(selectedRow.id) ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <KeyRound size={16} />
                      )}
                      Regenerate OTP
                    </button>
                    <button
                      className="btn btn-danger-outline"
                      onClick={() => {
                        setDeleteOrderId(String(selectedRow.id));
                        setSelectedRow(null);
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit order */}
      {editOrder && (
        <div className="modal-overlay" onClick={() => setEditOrder(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-title"
          >
            <div className="modal-header">
              <h2 id="edit-order-title">
                <Pencil size={20} style={{ marginRight: 8, verticalAlign: '-4px' }} />
                Edit Order
              </h2>
              <button className="modal-close" onClick={() => setEditOrder(null)} aria-label="Close dialog">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-order-fuel">Requested Fuel (litres)</label>
                <input
                  id="edit-order-fuel"
                  type="number"
                  min="0"
                  value={editFuel}
                  onChange={e => setEditFuel(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-order-grade">Fuel Grade</label>
                <select id="edit-order-grade" value={editGrade} onChange={e => setEditGrade(e.target.value)}>
                  <option value="">—</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-order-destination">Destination</label>
                <input
                  id="edit-order-destination"
                  type="text"
                  placeholder="Optional"
                  value={editDestination}
                  onChange={e => setEditDestination(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditOrder(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEditOrder} disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete order confirmation */}
      <ConfirmDialog
        open={!!deleteOrderId}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteOrder}
        onCancel={() => setDeleteOrderId(null)}
      />
    </div>
  );
}
