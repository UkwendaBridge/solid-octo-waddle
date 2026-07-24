/**
 * Bulk driver registration — one row per driver: name, truck number, phone.
 * Each row creates a driver + a truck (vehicle) linked to it on the backend.
 * The driver's login password defaults to their phone number.
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { customerDrivers } from '../services/api';
import {
  Plus, Trash2, Upload, Download, Send, Loader2, CheckCircle2, ArrowLeft, Users,
} from 'lucide-react';

const BULK_DRIVER_LIMIT = 500;

type RowStatus = 'idle' | 'success' | 'error';
interface Row {
  uid: string;
  name: string;
  truck: string;
  phone: string;
  status: RowStatus;
  message?: string;
}

let counter = 0;
const makeRow = (): Row => ({ uid: `r${++counter}`, name: '', truck: '', phone: '', status: 'idle' });

export default function BulkDriverPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<Row[]>([makeRow(), makeRow(), makeRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ created: number } | null>(null);

  const update = (uid: string, field: 'name' | 'truck' | 'phone', value: string) =>
    setRows(prev => prev.map(r => (r.uid === uid ? { ...r, [field]: value, status: 'idle', message: undefined } : r)));
  const addRow = () => setRows(prev => [...prev, makeRow()]);
  const removeRow = (uid: string) => setRows(prev => (prev.length > 1 ? prev.filter(r => r.uid !== uid) : prev));
  const clearAll = () => { setRows([makeRow(), makeRow(), makeRow()]); setDone(null); };

  const downloadTemplate = () => {
    const csv = 'name,truck_number,phone\nJohn Banda,ALZ 1234,0977000001\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bulk-drivers-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) { toast.error('No rows found in the CSV.'); return; }
      // Skip a header row if present.
      const start = /name/i.test(lines[0]) && /phone/i.test(lines[0]) ? 1 : 0;
      const parsed: Row[] = lines.slice(start).map(line => {
        const [name = '', truck = '', phone = ''] = line.split(',').map(c => c.trim());
        return { ...makeRow(), name, truck, phone };
      });
      if (parsed.length === 0) { toast.error('No data rows in the CSV.'); return; }
      setRows(parsed);
      setDone(null);
      toast.success(`Loaded ${parsed.length} row(s) from CSV.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filled = rows.filter(r => r.name || r.truck || r.phone);

  const submit = async () => {
    const toSubmit = rows.filter(r => r.name || r.truck || r.phone);
    if (toSubmit.length === 0) { toast.error('Add at least one driver.'); return; }
    if (toSubmit.length > BULK_DRIVER_LIMIT) { toast.error(`Max ${BULK_DRIVER_LIMIT} drivers per batch.`); return; }

    // Local shape check before hitting the server.
    const bad = toSubmit.filter(r => !r.name.trim() || !r.truck.trim() || !r.phone.trim());
    if (bad.length > 0) {
      setRows(prev => prev.map(r => (bad.some(b => b.uid === r.uid) ? { ...r, status: 'error', message: 'All three fields required' } : r)));
      toast.error('Fill in name, truck and phone on every row.');
      return;
    }

    setSubmitting(true);
    const res = await customerDrivers.bulkRegister(
      toSubmit.map(r => ({ name: r.name.trim(), truck_number: r.truck.trim(), phone: r.phone.trim() })),
    );
    setSubmitting(false);

    if (res.success && res.data) {
      setRows(prev => prev.map(r => (toSubmit.some(t => t.uid === r.uid) ? { ...r, status: 'success', message: 'Registered' } : r)));
      setDone({ created: res.data.created });
      toast.success(`${res.data.created} driver(s) registered with trucks.`);
      return;
    }

    if (res.rowErrors && res.rowErrors.length > 0) {
      const byUid = new Map(res.rowErrors.map(e => [toSubmit[e.index]?.uid, e.error]));
      setRows(prev => prev.map(r => (byUid.has(r.uid) ? { ...r, status: 'error', message: byUid.get(r.uid) } : r)));
      toast.error(`${res.rowErrors.length} row(s) need fixing — nothing was created.`);
    } else {
      toast.error(res.error || 'Bulk registration failed.');
    }
  };

  if (done) {
    return (
      <div className="page">
        <div className="section" style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircle2 size={44} style={{ color: 'var(--qb-green)' }} />
          <h2 style={{ marginTop: 12 }}>{done.created} driver(s) registered</h2>
          <p className="text-muted">Each driver was created with a truck. Their login password is their phone number.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard/drivers')}>View drivers</button>
            <button className="btn btn-outline" onClick={clearAll}>Register more</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/drivers')}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1><Users size={22} style={{ verticalAlign: '-3px', marginRight: 8 }} /> Bulk Register Drivers</h1>
          <p className="text-muted">Add many drivers at once — each with a truck and phone.</p>
        </div>
      </div>

      <div className="bulk-toolbar">
        <button className="btn btn-outline btn-sm" onClick={addRow}><Plus size={16} /> Add Row</button>
        <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Import CSV</button>
        <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}><Download size={16} /> Template</button>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: 'none' }} />
        <div className="bulk-toolbar-spacer" />
        <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear</button>
      </div>

      <div className="table-wrapper">
        <table className="data-table bulk-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Driver Name</th>
              <th>Truck Number</th>
              <th>Phone Number</th>
              <th style={{ width: 170 }}>Status</th>
              <th style={{ width: 50 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.uid} className={row.status === 'error' ? 'bulk-row-error' : ''}>
                <td className="text-muted">{idx + 1}</td>
                <td><input className="bulk-input" value={row.name} onChange={e => update(row.uid, 'name', e.target.value)} placeholder="e.g. John Banda" /></td>
                <td><input className="bulk-input" value={row.truck} onChange={e => update(row.uid, 'truck', e.target.value)} placeholder="e.g. ALZ 1234" /></td>
                <td><input className="bulk-input" value={row.phone} onChange={e => update(row.uid, 'phone', e.target.value)} placeholder="e.g. 0977000001" inputMode="tel" /></td>
                <td>
                  {row.status === 'success' && <span style={{ color: 'var(--qb-green)', fontSize: 13 }}>✓ {row.message}</span>}
                  {row.status === 'error' && <span className="text-danger" style={{ fontSize: 13 }}>{row.message}</span>}
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeRow(row.uid)} aria-label="Remove row">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
        <p className="text-muted" style={{ margin: 0 }}>
          {filled.length} driver{filled.length === 1 ? '' : 's'} ready · password defaults to the phone number
        </p>
        <button className="btn btn-primary" onClick={submit} disabled={submitting || filled.length === 0}>
          {submitting ? <><Loader2 size={16} className="spin" /> Registering…</> : <><Send size={16} /> Register {filled.length || ''} Driver{filled.length === 1 ? '' : 's'}</>}
        </button>
      </div>
    </div>
  );
}
