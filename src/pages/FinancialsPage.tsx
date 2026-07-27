import { useState } from 'react';
import { formatCurrency, formatDateTime } from '../utils/format';
import DevBanner from '../components/DevBanner';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import PageToolbar from '../components/PageToolbar';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { usePagination } from '../hooks/usePagination';
import {
  DollarSign,
  Plus,
  CreditCard,
  Banknote,
  Receipt,
  Check,
  Download,
  Calendar,
  User,
  Hash,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

interface Payment {
  id: string;
  dateTime: string;
  customerName: string;
  customerId: string;
  type: 'Account Payment' | 'AR Receipt';
  amount: number;
  method: 'Credit Card' | 'Check' | 'Cash' | 'Bank Transfer';
  reference: string;
  balanceAfter: number;
}

// Mock data - in production this would come from API
const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    dateTime: '2026-03-10T09:15:00',
    customerName: 'John Mokoena',
    customerId: 'cust-001',
    type: 'Account Payment',
    amount: 45000,
    method: 'Credit Card',
    reference: 'TXN-884721',
    balanceAfter: 12500,
  },
  {
    id: 'pay-002',
    dateTime: '2026-03-09T14:30:00',
    customerName: 'Sarah Naidoo',
    customerId: 'cust-002',
    type: 'AR Receipt',
    amount: 28750,
    method: 'Check',
    reference: 'CHK-006214',
    balanceAfter: 0,
  },
  {
    id: 'pay-003',
    dateTime: '2026-03-08T11:45:00',
    customerName: 'David van Wyk',
    customerId: 'cust-003',
    type: 'Account Payment',
    amount: 15200,
    method: 'Cash',
    reference: 'RCP-330198',
    balanceAfter: 34800,
  },
  {
    id: 'pay-004',
    dateTime: '2026-03-07T16:20:00',
    customerName: 'John Mokoena',
    customerId: 'cust-001',
    type: 'AR Receipt',
    amount: 62000,
    method: 'Credit Card',
    reference: 'TXN-884935',
    balanceAfter: 8000,
  },
  {
    id: 'pay-005',
    dateTime: '2026-03-06T08:00:00',
    customerName: 'Sarah Naidoo',
    customerId: 'cust-002',
    type: 'Account Payment',
    amount: 9500,
    method: 'Check',
    reference: 'CHK-006301',
    balanceAfter: 20500,
  },
];

type PaymentType = 'all' | 'Account Payment' | 'AR Receipt';

export default function FinancialsPage() {
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<PaymentType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New payment form
  const [newPayment, setNewPayment] = useState({
    customerName: '',
    customerId: '',
    type: 'Account Payment' as 'Account Payment' | 'AR Receipt',
    amount: '',
    method: 'Credit Card' as Payment['method'],
    reference: '',
  });

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      search === '' ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.customerId.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || p.type === filterType;

    return matchesSearch && matchesType;
  });

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredPayments);

  const getMethodIcon = (method: Payment['method']) => {
    switch (method) {
      case 'Credit Card':
        return <CreditCard size={14} />;
      case 'Cash':
        return <Banknote size={14} />;
      case 'Check':
      case 'Bank Transfer':
        return <Receipt size={14} />;
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.customerName || !newPayment.amount || !newPayment.reference) return;

    setIsSubmitting(true);

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      dateTime: new Date().toISOString(),
      customerName: newPayment.customerName,
      customerId: newPayment.customerId || `cust-${Math.random().toString(36).slice(2, 6)}`,
      type: newPayment.type,
      amount: parseFloat(newPayment.amount),
      method: newPayment.method,
      reference: newPayment.reference,
      balanceAfter: Math.random() * 50000, // Would be calculated by backend
    };

    setPayments([payment, ...payments]);
    setNewPayment({
      customerName: '',
      customerId: '',
      type: 'Account Payment',
      amount: '',
      method: 'Credit Card',
      reference: '',
    });
    setShowAddModal(false);
    setIsSubmitting(false);
  };

  return (
    <div className="page page-wide">
      <DevBanner />
      <PageHeader
        title="Payments"
        subtitle="Record and track all account payments &amp; AR receipts"
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline">
              <Download size={16} />
              Export
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              Record Payment
            </button>
            <button className="btn btn-warning">
              <ArrowDownCircle size={18} />
              Debt Account
            </button>
            <button className="btn btn-success">
              <ArrowUpCircle size={18} />
              Credit Account
            </button>
            <button className="btn btn-info">
              <DollarSign size={18} />
              Payment
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="stats-grid fade-in-up">
        <StatCard icon={<DollarSign size={22} />} value={formatCurrency(totalReceived)} label="Total Received" color="green" />
        <StatCard icon={<Receipt size={22} />} value={payments.length} label="Transactions" color="blue" />
      </div>

      {/* Toolbar */}
      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, ID or reference…"
      />
      <div className="tab-filters">
        <button className={`tab-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All</button>
        <button className={`tab-btn ${filterType === 'Account Payment' ? 'active' : ''}`} onClick={() => setFilterType('Account Payment')}>Account Payment</button>
        <button className={`tab-btn ${filterType === 'AR Receipt' ? 'active' : ''}`} onClick={() => setFilterType('AR Receipt')}>AR Receipt</button>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={<Receipt size={48} />}
          title="No payments found"
          description={search || filterType !== 'all' ? 'Try adjusting your search or filter.' : 'No payments recorded yet.'}
        />
      ) : (
      <div className="table-card fade-in-up">
        <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Customer ID</th>
              <th>Type</th>
              <th>Amount Received</th>
              <th>Method</th>
              <th>Reference #</th>
              <th>Balance After</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(payment => (
                <tr key={payment.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      {formatDateTime(payment.dateTime)}
                    </div>
                  </td>
                  <td className="cell-bold">{payment.customerName}</td>
                  <td className="cell-mono">{payment.customerId}</td>
                  <td>
                    <span className={`status-badge ${payment.type === 'Account Payment' ? 'badge-applied' : 'badge-scheduled'}`}>
                      {payment.type}
                    </span>
                  </td>
                  <td className="cell-bold" style={{ color: 'var(--success)' }}>
                    {formatCurrency(payment.amount)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getMethodIcon(payment.method)}
                      {payment.method}
                    </div>
                  </td>
                  <td className="cell-mono">{payment.reference}</td>
                  <td>{formatCurrency(payment.balanceAfter)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn action-edit" title="View Details">
                        <Receipt size={16} />
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
      </div>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={<span className="modal-title-with-icon"><Receipt size={18} /> Record Payment</span>}
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddPayment} disabled={isSubmitting || !newPayment.customerName || !newPayment.amount || !newPayment.reference}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isSubmitting ? 'Saving...' : 'Record Payment'}
            </button>
          </>
        }
      >
        <div className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pay-cust-name"><User size={13} /> Customer Name <span className="field-required">*</span></label>
              <input id="pay-cust-name" type="text" placeholder="Enter customer name" value={newPayment.customerName} onChange={e => setNewPayment({ ...newPayment, customerName: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="pay-cust-id"><Hash size={13} /> Customer ID</label>
              <input id="pay-cust-id" type="text" placeholder="e.g. cust-001" value={newPayment.customerId} onChange={e => setNewPayment({ ...newPayment, customerId: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pay-type">Payment Type</label>
              <select id="pay-type" value={newPayment.type} onChange={e => setNewPayment({ ...newPayment, type: e.target.value as 'Account Payment' | 'AR Receipt' })}>
                <option value="Account Payment">Account Payment</option>
                <option value="AR Receipt">AR Receipt</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="pay-method">Payment Method</label>
              <select id="pay-method" value={newPayment.method} onChange={e => setNewPayment({ ...newPayment, method: e.target.value as Payment['method'] })}>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pay-amount"><DollarSign size={13} /> Amount (R) <span className="field-required">*</span></label>
              <input id="pay-amount" type="number" placeholder="0.00" min="0" step="0.01" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="pay-ref"><Receipt size={13} /> Reference # <span className="field-required">*</span></label>
              <input id="pay-ref" type="text" placeholder="e.g. TXN-123456" value={newPayment.reference} onChange={e => setNewPayment({ ...newPayment, reference: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
