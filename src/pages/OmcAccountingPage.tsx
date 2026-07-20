import { useState, useEffect } from 'react';
import { omcBalance } from '../services/api';
import PageToolbar from '../components/PageToolbar';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { useToast } from '../context/ToastContext';
import {
  Calculator,
  Users,
  Wallet,
  Plus,
  Edit3,
  History,
  RefreshCw,
  Loader2,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import type { BackendBalanceTransaction } from '../types/api';

interface CustomerBalance {
  id: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  created_at: string;
}

interface BalanceSummary {
  total_customers: number;
  total_balance: number;
  positive_balances: number;
  negative_balances: number;
}

type TransactionType = 'prepayment' | 'adjustment' | 'refund' | 'set';

export default function OmcAccountingPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<CustomerBalance[]>([]);
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerBalance | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [actionType, setActionType] = useState<TransactionType>('prepayment');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // History modal state
  const [customerHistory, setCustomerHistory] = useState<BackendBalanceTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await omcBalance.getAll();
      if (res.success && res.data) {
        const mappedCustomers = res.data.customers.map(c => ({
          ...c,
          balance: typeof c.balance === 'string' ? parseFloat(c.balance) : c.balance,
        }));
        setCustomers(mappedCustomers);
        setSummary(res.data.summary);
      } else {
        setError(res.error || 'Failed to load data');
      }
    } catch {
      setError('Failed to load balance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(num);
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      search === '' ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filtered);

  const openActionModal = (customer: CustomerBalance, type: TransactionType) => {
    setSelectedCustomer(customer);
    setActionType(type);
    setAmount('');
    setNotes('');
    setShowActionModal(true);
  };

  const openHistoryModal = async (customer: CustomerBalance) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    
    const res = await omcBalance.getCustomerHistory(customer.id, 50);
    if (res.success && res.data) {
      setCustomerHistory(res.data.transactions);
    }
    setHistoryLoading(false);
  };

  const handleAction = async () => {
    if (!selectedCustomer || !amount) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (actionType === 'set' && !notes.trim()) {
      toast.error('Notes are required for balance adjustments');
      return;
    }

    setIsSaving(true);
    let res;

    try {
      switch (actionType) {
        case 'prepayment':
        case 'adjustment':
        case 'refund':
          res = await omcBalance.addFunds(selectedCustomer.id, amountNum, actionType, notes || undefined);
          break;
        case 'set':
          res = await omcBalance.setBalance(selectedCustomer.id, amountNum, notes);
          break;
      }

      if (res?.success) {
        toast.success(`Balance updated successfully`);
        setShowActionModal(false);
        fetchData(); // Refresh data
      } else {
        toast.error(res?.error || 'Failed to update balance');
      }
    } catch {
      toast.error('Failed to update balance');
    } finally {
      setIsSaving(false);
    }
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'prepayment': return 'Add Payment';
      case 'adjustment': return 'Add Adjustment';
      case 'refund': return 'Add Refund';
      case 'set': return 'Set Balance';
      default: return 'Update Balance';
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case 'prepayment':
      case 'adjustment':
      case 'refund':
        return <Plus size={20} />;
      case 'set':
        return <Edit3 size={20} />;
      default:
        return <DollarSign size={20} />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'prepayment': return 'Prepayment';
      case 'fuel_debit': return 'Fuel Purchase';
      case 'adjustment': return 'Adjustment';
      case 'refund': return 'Refund';
      default: return type;
    }
  };

  if (isLoading && customers.length === 0) {
    return (
      <div className="page page-wide">
        <div className="empty-state">
          <Loader2 size={48} className="animate-spin" />
          <p>Loading accounting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>
            <Calculator size={28} style={{ marginRight: 8 }} />
            Accounting
          </h1>
          <p className="text-muted">Manage customer balances and payments</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchData} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
              <Users size={22} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Customers</p>
              <h3 className="stat-value">{summary.total_customers}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--info-light)' }}>
              <Wallet size={22} style={{ color: 'var(--info)' }} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Balance</p>
              <h3 className="stat-value">{formatCurrency(summary.total_balance)}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
              <TrendingUp size={22} style={{ color: 'var(--success)' }} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Credit Accounts</p>
              <h3 className="stat-value">{summary.positive_balances}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>
              <TrendingDown size={22} style={{ color: 'var(--danger)' }} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Outstanding</p>
              <h3 className="stat-value">{summary.negative_balances}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <PageToolbar 
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or phone…"
      />

      {/* Customers Table */}
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
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(c => (
                <tr key={c.id}>
                  <td className="cell-bold">{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td style={{ 
                    fontWeight: 600,
                    color: c.balance >= 0 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {formatCurrency(c.balance)}
                  </td>
                  <td>
                    <div className="table-actions" style={{ gap: '0.25rem' }}>
                      <button 
                        className="action-btn" 
                        title="Add Payment"
                        style={{ background: 'var(--success-light)', color: 'var(--success)' }}
                        onClick={() => openActionModal(c, 'prepayment')}
                      >
                        <Plus size={15} />
                      </button>
                      <button 
                        className="action-btn" 
                        title="Set Balance"
                        style={{ background: 'var(--info-light)', color: 'var(--info)' }}
                        onClick={() => openActionModal(c, 'set')}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="action-btn" 
                        title="View History"
                        style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}
                        onClick={() => openHistoryModal(c)}
                      >
                        <History size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Action Modal */}
      {showActionModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>
                {getActionIcon()}
                <span style={{ marginLeft: 8 }}>{getActionTitle()}</span>
              </h2>
              <button className="modal-close" onClick={() => setShowActionModal(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="customer-info" style={{ 
                background: 'var(--bg)', 
                padding: '1rem', 
                borderRadius: 'var(--radius)', 
                marginBottom: '1rem' 
              }}>
                <p style={{ fontWeight: 600 }}>{selectedCustomer.name}</p>
                <p className="text-muted">{selectedCustomer.email}</p>
                <p style={{ 
                  fontWeight: 600, 
                  marginTop: '0.5rem',
                  color: selectedCustomer.balance >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  Current Balance: {formatCurrency(selectedCustomer.balance)}
                </p>
              </div>

              {actionType !== 'set' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Transaction Type</label>
                  <select 
                    value={actionType} 
                    onChange={e => setActionType(e.target.value as TransactionType)}
                    className="form-select"
                  >
                    <option value="prepayment">Prepayment (Customer paid)</option>
                    <option value="adjustment">Adjustment (Correction)</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>
                  <DollarSign size={14} />
                  {actionType === 'set' ? 'New Balance (ZMW)' : 'Amount (ZMW)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={actionType === 'set' ? 'Enter new balance' : 'Enter amount'}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Notes {actionType === 'set' && <span className="text-danger">*</span>}</label>
                <textarea
                  placeholder={actionType === 'set' ? 'Reason for adjustment (required)' : 'Optional notes'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowActionModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary"
                onClick={handleAction}
                disabled={isSaving || !amount}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {isSaving ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-wide" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>
                <History size={20} />
                <span style={{ marginLeft: 8 }}>Transaction History</span>
              </h2>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="customer-info" style={{ 
                background: 'var(--bg)', 
                padding: '1rem', 
                borderRadius: 'var(--radius)', 
                marginBottom: '1rem' 
              }}>
                <p style={{ fontWeight: 600 }}>{selectedCustomer.name}</p>
                <p className="text-muted">{selectedCustomer.email}</p>
              </div>

              {historyLoading ? (
                <div className="empty-state">
                  <Loader2 size={32} className="animate-spin" />
                  <p>Loading history...</p>
                </div>
              ) : customerHistory.length === 0 ? (
                <div className="empty-state">
                  <History size={48} />
                  <p>No transactions found.</p>
                </div>
              ) : (
                <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Balance</th>
                        <th>By</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerHistory.map(tx => {
                        const amt = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
                        return (
                          <tr key={tx.id}>
                            <td>{new Date(tx.created_at).toLocaleString('en-ZA')}</td>
                            <td>
                              <span className={`badge ${amt >= 0 ? 'badge-success' : 'badge-warning'}`}>
                                {amt >= 0 ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                                <span style={{ marginLeft: 4 }}>{getTransactionLabel(tx.transaction_type)}</span>
                              </span>
                            </td>
                            <td style={{ 
                              fontWeight: 600,
                              color: amt >= 0 ? 'var(--success)' : 'var(--danger)'
                            }}>
                              {amt >= 0 ? '+' : ''}{formatCurrency(amt)}
                            </td>
                            <td>{formatCurrency(tx.balance_after)}</td>
                            <td className="text-muted">{tx.performed_by_name || tx.performed_by_type}</td>
                            <td className="text-muted">{tx.notes || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
