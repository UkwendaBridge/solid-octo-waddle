import { useState } from 'react';
import { formatCurrency, formatDateTime } from '../utils/format';
import DevBanner from '../components/DevBanner';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import PageToolbar from '../components/PageToolbar';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { Receipt, Download, Fuel, TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  dateTime: string;
  stationId: string;
  stationName: string;
  pumpNumber: number;
  attendantName: string;
  fuelType: 'Petrol' | 'Diesel';
  litres: number;
  pricePerLitre: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Fleet Card' | 'Account';
  reference: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-001',
    dateTime: '2026-03-11T10:45:00',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    pumpNumber: 3,
    attendantName: 'Sipho Mahlangu',
    fuelType: 'Petrol',
    litres: 45.5,
    pricePerLitre: 24.89,
    totalAmount: 1132.50,
    paymentMethod: 'Card',
    reference: 'CC-884721',
  },
  {
    id: 'TXN-002',
    dateTime: '2026-03-11T10:32:00',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    pumpNumber: 1,
    attendantName: 'Sipho Mahlangu',
    fuelType: 'Diesel',
    litres: 120.0,
    pricePerLitre: 23.45,
    totalAmount: 2814.00,
    paymentMethod: 'Fleet Card',
    reference: 'FC-337821',
  },
  {
    id: 'TXN-003',
    dateTime: '2026-03-11T10:18:00',
    stationId: 'STN-002',
    stationName: 'Caltex Rosebank',
    pumpNumber: 2,
    attendantName: 'Peter Molefe',
    fuelType: 'Petrol',
    litres: 30.0,
    pricePerLitre: 24.89,
    totalAmount: 746.70,
    paymentMethod: 'Cash',
    reference: 'CSH-001234',
  },
  {
    id: 'TXN-004',
    dateTime: '2026-03-11T09:55:00',
    stationId: 'STN-003',
    stationName: 'Engen Melrose',
    pumpNumber: 1,
    attendantName: 'Thabo Zulu',
    fuelType: 'Diesel',
    litres: 80.5,
    pricePerLitre: 23.45,
    totalAmount: 1887.73,
    paymentMethod: 'Account',
    reference: 'ACC-556677',
  },
  {
    id: 'TXN-005',
    dateTime: '2026-03-11T09:40:00',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    pumpNumber: 5,
    attendantName: 'Grace Dlamini',
    fuelType: 'Petrol',
    litres: 55.2,
    pricePerLitre: 24.89,
    totalAmount: 1373.93,
    paymentMethod: 'Card',
    reference: 'CC-884802',
  },
  {
    id: 'TXN-006',
    dateTime: '2026-03-11T09:22:00',
    stationId: 'STN-002',
    stationName: 'Caltex Rosebank',
    pumpNumber: 4,
    attendantName: 'Peter Molefe',
    fuelType: 'Diesel',
    litres: 200.0,
    pricePerLitre: 23.45,
    totalAmount: 4690.00,
    paymentMethod: 'Fleet Card',
    reference: 'FC-337845',
  },
];

type FilterType = 'all' | 'Petrol' | 'Diesel';
type PaymentFilter = 'all' | 'Cash' | 'Card' | 'Fleet Card' | 'Account';

const PAYMENT_CLASSES: Record<Transaction['paymentMethod'], string> = {
  Cash: 'payment-cash',
  Card: 'payment-card',
  'Fleet Card': 'payment-fleet',
  Account: 'payment-account',
};

export default function TransactionsPage() {
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [search, setSearch] = useState('');
  const [filterFuel, setFilterFuel] = useState<FilterType>('all');
  const [filterPayment, setFilterPayment] = useState<PaymentFilter>('all');

  const totalVolume = transactions.reduce((sum, t) => sum + t.litres, 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      search === '' ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.stationName.toLowerCase().includes(search.toLowerCase()) ||
      t.attendantName.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase());

    const matchesFuel = filterFuel === 'all' || t.fuelType === filterFuel;
    const matchesPayment = filterPayment === 'all' || t.paymentMethod === filterPayment;

    return matchesSearch && matchesFuel && matchesPayment;
  });

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredTransactions);

  return (
    <div className="page page-wide">
      <DevBanner />
      <PageHeader
        title="Transactions"
        subtitle="View all fuel dispensing transactions"
        action={
          <button className="btn btn-outline">
            <Download size={16} />
            Export
          </button>
        }
      />

      <div className="stats-grid fade-in-up">
        <StatCard icon={<Receipt size={22} />} value={transactions.length} label="Total Transactions" color="blue" />
        <StatCard icon={<Fuel size={22} />} value={`${totalVolume.toFixed(1)} L`} label="Volume Dispensed" color="purple" />
        <StatCard icon={<TrendingUp size={22} />} value={formatCurrency(totalRevenue)} label="Total Revenue" color="green" />
      </div>

      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search transactions by ID, station, attendant..."
      />

      <div className="tab-filters">
        <button className={`tab-btn ${filterFuel === 'all' ? 'active' : ''}`} onClick={() => setFilterFuel('all')}>All Fuel</button>
        <button className={`tab-btn ${filterFuel === 'Petrol' ? 'active' : ''}`} onClick={() => setFilterFuel('Petrol')}>Petrol</button>
        <button className={`tab-btn ${filterFuel === 'Diesel' ? 'active' : ''}`} onClick={() => setFilterFuel('Diesel')}>Diesel</button>
        <span className="tab-divider" />
        <button className={`tab-btn ${filterPayment === 'all' ? 'active' : ''}`} onClick={() => setFilterPayment('all')}>All Methods</button>
        <button className={`tab-btn ${filterPayment === 'Cash' ? 'active' : ''}`} onClick={() => setFilterPayment('Cash')}>Cash</button>
        <button className={`tab-btn ${filterPayment === 'Card' ? 'active' : ''}`} onClick={() => setFilterPayment('Card')}>Card</button>
        <button className={`tab-btn ${filterPayment === 'Fleet Card' ? 'active' : ''}`} onClick={() => setFilterPayment('Fleet Card')}>Fleet</button>
        <button className={`tab-btn ${filterPayment === 'Account' ? 'active' : ''}`} onClick={() => setFilterPayment('Account')}>Account</button>
      </div>

      <div className="table-card fade-in-up">
        <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date & Time</th>
              <th>Station</th>
              <th>Pump</th>
              <th>Attendant</th>
              <th>Fuel Type</th>
              <th>Litres</th>
              <th>Price/L</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(txn => (
              <tr key={txn.id}>
                <td className="cell-mono cell-bold">{txn.id}</td>
                <td className="cell-muted">{formatDateTime(txn.dateTime)}</td>
                <td>{txn.stationName}</td>
                <td className="cell-muted">Pump {txn.pumpNumber}</td>
                <td>{txn.attendantName}</td>
                <td>
                  <span className={`status-badge ${txn.fuelType === 'Petrol' ? 'badge-active' : 'badge-night'}`}>
                    {txn.fuelType}
                  </span>
                </td>
                <td className="cell-bold">{txn.litres.toFixed(1)} <span className="cell-sub">L</span></td>
                <td className="cell-muted">{formatCurrency(txn.pricePerLitre)}</td>
                <td className="cell-bold" style={{ color: 'var(--success)' }}>{formatCurrency(txn.totalAmount)}</td>
                <td><span className={`payment-badge ${PAYMENT_CLASSES[txn.paymentMethod]}`}>{txn.paymentMethod}</span></td>
                <td className="cell-mono cell-muted">{txn.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={goToPage} />
      </div>
    </div>
  );
}
