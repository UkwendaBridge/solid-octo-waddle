import { useState, useEffect } from 'react';
import { customerBalance } from '../services/api';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  History,
  Filter,
} from 'lucide-react';
import type { BackendBalanceTransaction } from '../types/api';

export default function CustomerBalancePage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BackendBalanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        customerBalance.get(),
        customerBalance.getHistory(100, 0, filterType || undefined),
      ]);

      if (balanceRes.success && balanceRes.data) {
        setBalance(balanceRes.data.balance);
      }
      if (historyRes.success && historyRes.data) {
        setTransactions(historyRes.data.transactions);
      }
    } catch {
      setError('Failed to load balance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(transactions);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(num);
  };

  const getTransactionIcon = (_type: string, amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 0) {
      return <ArrowUpCircle size={18} className="text-success" />;
    }
    return <ArrowDownCircle size={18} className="text-danger" />;
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

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'prepayment': return 'badge badge-success';
      case 'fuel_debit': return 'badge badge-warning';
      case 'adjustment': return 'badge badge-info';
      case 'refund': return 'badge badge-purple';
      default: return 'badge';
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <Loader2 size={48} className="animate-spin" />
          <p>Loading balance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Balance</h1>
          <p className="text-muted">View your account balance and transaction history</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchData} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Balance Card */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-icon" style={{ background: balance >= 0 ? 'var(--success-light)' : 'var(--danger-light)' }}>
            <Wallet size={24} style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Current Balance</p>
            <h2 className="stat-value" style={{ 
              color: balance >= 0 ? 'var(--success)' : 'var(--danger)',
              fontSize: '2rem' 
            }}>
              {formatCurrency(balance)}
            </h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {balance >= 0 ? (
                <><TrendingUp size={14} style={{ marginRight: 4 }} />Credit available</>
              ) : (
                <><TrendingDown size={14} style={{ marginRight: 4 }} />Outstanding balance</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="section">
        <div className="section-header">
          <h2>
            <History size={20} style={{ marginRight: 8 }} />
            Transaction History
          </h2>
          <div className="filter-group">
            <Filter size={14} />
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Transactions</option>
              <option value="prepayment">Prepayments</option>
              <option value="fuel_debit">Fuel Purchases</option>
              <option value="adjustment">Adjustments</option>
              <option value="refund">Refunds</option>
            </select>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <History size={48} />
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(tx => {
                  const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
                  return (
                    <tr key={tx.id}>
                      <td>{new Date(tx.created_at).toLocaleString('en-ZA')}</td>
                      <td>
                        <span className={getTransactionBadge(tx.transaction_type)}>
                          {getTransactionIcon(tx.transaction_type, tx.amount)}
                          <span style={{ marginLeft: 6 }}>{getTransactionLabel(tx.transaction_type)}</span>
                        </span>
                      </td>
                      <td style={{ 
                        fontWeight: 600,
                        color: amount >= 0 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {amount >= 0 ? '+' : ''}{formatCurrency(amount)}
                      </td>
                      <td>{formatCurrency(tx.balance_after)}</td>
                      <td className="text-muted">{tx.notes || '—'}</td>
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
      </div>
    </div>
  );
}
