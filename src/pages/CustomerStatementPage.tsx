import { useState } from 'react';
import '../styles/qb-statement.css';
import { Mail, Printer, FileText, FileSpreadsheet, FileCheck, Edit3 } from 'lucide-react';

interface StatementRow {
  date: string;
  type: string;
  reference: string;
  description: string;
  vehicle: string;
  debit: string;
  credit: string;
  balance: string;
}

const CUSTOMER_LIST = [
  'Apex Logistics Solutions',
  'ABC Transport Ltd',
  'John Mokoena',
  'Sarah Naidoo',
];

const STATEMENT_DATA = [
  { date: '2026-03-01', type: 'Opening', reference: '—', description: 'Balance B/F', vehicle: '', debit: '', credit: '', balance: 'ZMW1,250.00', },
  { date: '2026-03-05', type: 'Invoice', reference: 'INV-8801', description: 'Fuel - Lusaka Central', vehicle: 'ABX1234', debit: 'ZMW1,435.79', credit: '', balance: 'ZMW2,685.79', },
  { date: '2026-03-12', type: 'Payment', reference: 'EFT-7721', description: 'Bank Transfer', vehicle: '', debit: '', credit: 'ZMW2,500.00', balance: 'ZMW185.79', },
  { date: '2026-03-15', type: 'Invoice', reference: 'INV-8942', description: 'Fuel - Ndola West', vehicle: 'XYZ5678', debit: 'ZMW997.55', credit: '', balance: 'ZMW1,183.34', },
  { date: '2026-03-20', type: 'Invoice', reference: 'INV-9011', description: 'Fuel - Kitwe North', vehicle: 'ABC-7890', debit: 'ZMW3,432.75', credit: '', balance: 'ZMW4,616.09', },
  { date: '2026-03-25', type: 'Payment', reference: 'EFT-7855', description: 'Bank Transfer', vehicle: '', debit: '', credit: 'ZMW3,000.00', balance: 'ZMW1,616.09', },
];

export default function CustomerStatementPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(CUSTOMER_LIST[0]);
  const [period, setPeriod] = useState({ start: '2026-03-01', end: '2026-03-31' });
  const [viewedTx, setViewedTx] = useState<StatementRow | null>(null);
  const [editTx, setEditTx] = useState<StatementRow | null>(null);

  return (
    <div className="zoo-statement-container">
      <h2 className="zoo-statement-title">Customer Statement</h2>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, alignItems: 'center' }}>
        <div>
          <label htmlFor="customer-select" style={{ fontWeight: 600, color: '#4a5a47', marginRight: 8 }}>Customer:</label>
          <select
            id="customer-select"
            value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #c8e1c8', fontSize: '1em', color: '#3a4a37' }}
          >
            {CUSTOMER_LIST.map(cust => (
              <option key={cust} value={cust}>{cust}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="period-start" style={{ fontWeight: 600, color: '#4a5a47', marginRight: 8 }}>Period:</label>
          <input
            id="period-start"
            type="date"
            value={period.start}
            onChange={e => setPeriod(p => ({ ...p, start: e.target.value }))}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #c8e1c8', fontSize: '1em', color: '#3a4a37', marginRight: 8 }}
          />
          <span style={{ fontWeight: 600, color: '#4a5a47', margin: '0 8px' }}>to</span>
          <input
            id="period-end"
            type="date"
            value={period.end}
            onChange={e => setPeriod(p => ({ ...p, end: e.target.value }))}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #c8e1c8', fontSize: '1em', color: '#3a4a37' }}
          />
        </div>
        <button
          className="qb-icon-btn"
          title="Generate Statement"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8 }}
          onClick={() => { /* Generate statement */ }}
        >
          <FileCheck size={26} color="#059669" />
        </button>
        <div style={{ display: 'flex', gap: 12, marginLeft: 24 }}>
          <button className="qb-icon-btn" title="Email Statement" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Mail size={22} color="#059669" />
          </button>
          <button className="qb-icon-btn" title="Print Statement" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => window.print()}>
            <Printer size={22} color="#059669" />
          </button>
          <button className="qb-icon-btn" title="Export PDF" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <FileText size={22} color="#059669" />
          </button>
          <button className="qb-icon-btn" title="Export Excel" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <FileSpreadsheet size={22} color="#059669" />
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 18, fontWeight: 600, color: '#059669', fontSize: '1.1em' }}>
        Customer Name: {selectedCustomer}
      </div>
      <div className="zoo-statement-table-card">
        <table className="zoo-statement-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Vehicle Reg Number</th>
              <th>Debits (Invoices)</th>
              <th>Credits (Payments)</th>
              <th>Running Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {STATEMENT_DATA.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td>
                  <span
                    style={{ color: '#059669', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setViewedTx(row)}
                  >
                    {row.type}
                  </span>
                </td>
                <td>{row.reference}</td>
                <td>{row.description}</td>
                <td>{row.vehicle}</td>
                <td className="zoo-debit">{row.debit}</td>
                <td className="zoo-credit">{row.credit}</td>
                <td className="zoo-balance">{row.balance}</td>
                <td>
                  {row.credit ? (
                    <button
                      className="qb-icon-btn"
                      title="Edit Payment Credit"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => setEditTx(row)}
                    >
                      <Edit3 size={18} color="#059669" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewedTx && (
        <div className="zoo-view-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(120,130,110,0.12)', padding: '32px 28px', minWidth: 320 }}>
            <h3 style={{ color: '#059669', fontWeight: 700, marginBottom: 18 }}>Transaction Details</h3>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <tbody>
                <tr><td style={{ fontWeight: 600 }}>Date</td><td>{viewedTx.date}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Type</td><td>{viewedTx.type}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Reference</td><td>{viewedTx.reference}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Description</td><td>{viewedTx.description}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Vehicle Reg Number</td><td>{viewedTx.vehicle}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Debit</td><td>{viewedTx.debit}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Credit</td><td>{viewedTx.credit}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Running Balance</td><td>{viewedTx.balance}</td></tr>
              </tbody>
            </table>
            <button
              className="btn btn-primary"
              style={{ marginTop: 24, padding: '8px 18px', fontSize: '1em', borderRadius: 8 }}
              onClick={() => setViewedTx(null)}
            >Close</button>
          </div>
        </div>
      )}
      {editTx && (
        <div className="zoo-view-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(120,130,110,0.12)', padding: '32px 28px', minWidth: 320 }}>
            <h3 style={{ color: '#059669', fontWeight: 700, marginBottom: 18 }}>Edit Payment Credit</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, color: '#4a5a47', marginRight: 8 }}>Credit Amount:</label>
              <input
                type="text"
                value={editTx.credit}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #c8e1c8', fontSize: '1em', color: '#3a4a37', width: 120 }}
                readOnly
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 24, padding: '8px 18px', fontSize: '1em', borderRadius: 8 }}
              onClick={() => setEditTx(null)}
            >Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
