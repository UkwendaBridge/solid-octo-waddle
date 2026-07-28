import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useDrivers } from '../context/DriverContext';
import { useVehicles } from '../context/VehicleContext';
import { useToast } from '../context/ToastContext';
import { customerOrders } from '../services/api';
import SearchableSelect, { type SearchableOption } from '../components/SearchableSelect';
import type { FuelType, Vehicle } from '../types';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Users,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Layers,
} from 'lucide-react';

const FUEL_TYPES: FuelType[] = ['Petrol', 'Diesel'];

// A-Z the way a reader expects: case- and accent-insensitive.
const byName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

// Must match BULK_ORDER_LIMIT on the backend (POST /customer/orders/bulk).
const BULK_ORDER_LIMIT = 500;

type RowStatus = 'idle' | 'pending' | 'success' | 'error';

interface BulkRow {
  uid: string;
  driverId: string;
  vehicleId: string;
  fuelType: FuelType;
  volume: number;
  destination: string;
  status: RowStatus;
  message?: string;
}

let rowCounter = 0;
const makeRow = (partial: Partial<BulkRow> = {}): BulkRow => ({
  uid: `row-${Date.now()}-${rowCounter++}`,
  driverId: '',
  vehicleId: '',
  fuelType: 'Diesel',
  volume: 0,
  destination: '',
  status: 'idle',
  ...partial,
});

export default function BulkOrderPage() {
  const { user } = useAuth();
  const { fetchOrders } = useOrders();
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<BulkRow[]>([makeRow(), makeRow(), makeRow()]);
  const [autoSend, setAutoSend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState<{ created: number; failed: number } | null>(null);

  // Drivers A-Z, each showing their assigned vehicle so the auto-fill is no
  // surprise. Sorted on a copy — the context array is shared.
  const driverOptions = useMemo(
    () =>
      [...drivers]
        .sort((a, b) => byName(a.name, b.name))
        .map(d => {
          const assigned = vehicles.find(v => v.assignedDriverId === d.id);
          return {
            value: d.id,
            label: d.name,
            sublabel: assigned ? `${d.phone} · ${assigned.regNumber}` : d.phone,
          };
        }),
    [drivers, vehicles],
  );

  // Bucketed once rather than per row: "add a row per driver" can produce
  // hundreds of rows, and re-filtering every vehicle for each of them on every
  // keystroke is what makes a page like this crawl. A row only ever offers its
  // own driver's vehicles plus the unassigned pool, and both lists are tiny.
  const { optionsByDriver, poolOptions } = useMemo(() => {
    const toOption = (v: Vehicle) => ({
      value: v.id,
      label: v.regNumber,
      sublabel: v.tankCapacity > 0 ? `${v.type} · ${v.tankCapacity}L` : v.type,
    });
    const byDriver = new Map<string, SearchableOption[]>();
    const pool: SearchableOption[] = [];
    for (const v of vehicles) {
      if (v.assignedDriverId) {
        const list = byDriver.get(v.assignedDriverId);
        if (list) list.push(toOption(v));
        else byDriver.set(v.assignedDriverId, [toOption(v)]);
      } else {
        pool.push(toOption(v));
      }
    }
    const sortByLabel = (l: SearchableOption[]) => l.sort((a, b) => byName(a.label, b.label));
    sortByLabel(pool);
    byDriver.forEach(sortByLabel);
    return { optionsByDriver: byDriver, poolOptions: pool };
  }, [vehicles]);

  if (!user) return null;

  // Map a driver to their assigned vehicle (if any) for auto-fill convenience.
  const vehicleForDriver = (driverId: string) =>
    vehicles.find(v => v.assignedDriverId === driverId);

  const updateRow = (uid: string, patch: Partial<BulkRow>) => {
    setRows(prev => prev.map(r => (r.uid === uid ? { ...r, ...patch, status: 'idle', message: undefined } : r)));
  };

  // Picking a driver pulls in their assigned vehicle. A driver with none of
  // their own leaves a pool vehicle alone, but clears one that belongs to a
  // different driver rather than leaving the row mismatched.
  const handleDriverChange = (uid: string, driverId: string) => {
    const assigned = vehicleForDriver(driverId);
    setRows(prev =>
      prev.map(r => {
        if (r.uid !== uid) return r;
        const current = vehicles.find(v => v.id === r.vehicleId);
        const keepCurrent = current && !current.assignedDriverId;
        return {
          ...r,
          driverId,
          vehicleId: assigned?.id ?? (keepCurrent ? r.vehicleId : ''),
          status: 'idle',
          message: undefined,
        };
      }),
    );
  };

  const addRow = () => setRows(prev => [...prev, makeRow()]);

  const removeRow = (uid: string) => setRows(prev => prev.filter(r => r.uid !== uid));

  const clearAll = () => {
    setRows([makeRow()]);
    setDone(null);
  };

  // Quick action: one row per driver, with their assigned vehicle pre-filled.
  const addRowPerDriver = () => {
    if (drivers.length === 0) {
      toast.error('No drivers found. Add drivers first.');
      return;
    }
    const generated = [...drivers]
      .sort((a, b) => byName(a.name, b.name))
      .map(d => makeRow({ driverId: d.id, vehicleId: vehicleForDriver(d.id)?.id || '' }));
    // Replace any empty starter rows; otherwise append.
    setRows(prev => {
      const nonEmpty = prev.filter(r => r.driverId || r.vehicleId || r.volume > 0);
      return [...nonEmpty, ...generated];
    });
    setDone(null);
  };

  // ── CSV import ────────────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const header = 'driver,vehicle,fuel_type,volume,destination';
    const sample = drivers.slice(0, 2).map(d => {
      const v = vehicleForDriver(d.id);
      return `${d.name},${v?.regNumber ?? ''},Diesel,500,`;
    });
    const csv = [header, ...(sample.length ? sample : ['John Doe,ABC123,Diesel,500,Ndola depot'])].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-order-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('The CSV file is empty.');
      return;
    }

    // Drop header row if it looks like a header.
    const first = lines[0].toLowerCase();
    const dataLines = first.includes('driver') && first.includes('volume') ? lines.slice(1) : lines;

    const parsed: BulkRow[] = [];
    let unmatched = 0;

    for (const line of dataLines) {
      const [driverRaw = '', vehicleRaw = '', fuelRaw = '', volumeRaw = '', destinationRaw = ''] = line
        .split(',')
        .map(c => c.trim());

      const driverKey = driverRaw.toLowerCase();
      const driver = drivers.find(
        d => d.name.toLowerCase() === driverKey || d.phone === driverRaw,
      );

      const vehicleKey = vehicleRaw.toLowerCase();
      const vehicle =
        vehicles.find(v => v.regNumber.toLowerCase() === vehicleKey) ||
        (driver ? vehicleForDriver(driver.id) : undefined);

      const fuelType: FuelType = fuelRaw.toLowerCase().startsWith('p') ? 'Petrol' : 'Diesel';
      const volume = Number(volumeRaw) || 0;

      if (!driver) unmatched++;

      parsed.push(
        makeRow({
          driverId: driver?.id || '',
          vehicleId: vehicle?.id || '',
          fuelType,
          volume,
          destination: destinationRaw,
        }),
      );
    }

    if (parsed.length === 0) {
      toast.error('No rows found in the CSV file.');
      return;
    }

    setRows(parsed);
    setDone(null);
    if (unmatched > 0) {
      toast.error(`${unmatched} row(s) had a driver that could not be matched — please fix them.`);
    } else {
      toast.success(`Imported ${parsed.length} row(s) from CSV.`);
    }
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // allow re-importing the same file
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validateRow = (r: BulkRow): string | null => {
    if (!r.driverId) return 'Select a driver';
    if (!r.vehicleId) return 'Select a vehicle';
    if (!r.volume || r.volume <= 0) return 'Volume must be greater than 0';
    const vehicle = vehicles.find(v => v.id === r.vehicleId);
    if (vehicle && vehicle.tankCapacity > 0 && r.volume > vehicle.tankCapacity) {
      return `Volume exceeds tank capacity (${vehicle.tankCapacity} L)`;
    }
    return null;
  };

  const filledRows = rows.filter(r => r.driverId || r.vehicleId || r.volume > 0);
  const totalVolume = filledRows.reduce((sum, r) => sum + (r.volume || 0), 0);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const toSubmit = rows.filter(r => r.driverId || r.vehicleId || r.volume > 0);
    if (toSubmit.length === 0) {
      toast.error('Add at least one order row.');
      return;
    }

    if (toSubmit.length > BULK_ORDER_LIMIT) {
      toast.error(`You can submit at most ${BULK_ORDER_LIMIT} orders at once (you have ${toSubmit.length}).`);
      return;
    }

    // Validate everything up-front; flag invalid rows and stop.
    let hasError = false;
    setRows(prev =>
      prev.map(r => {
        if (!(r.driverId || r.vehicleId || r.volume > 0)) return r;
        const err = validateRow(r);
        if (err) hasError = true;
        return err ? { ...r, status: 'error', message: err } : { ...r, status: 'idle', message: undefined };
      }),
    );
    if (hasError) {
      toast.error('Please fix the highlighted rows before submitting.');
      return;
    }

    setIsSubmitting(true);
    setDone(null);
    setRows(prev =>
      prev.map(r =>
        toSubmit.some(t => t.uid === r.uid) ? { ...r, status: 'pending', message: undefined } : r,
      ),
    );

    // One transactional request: the backend creates every order or none of them.
    const res = await customerOrders.bulk(
      toSubmit.map(row => ({
        driver_id: row.driverId,
        vehicle_id: row.vehicleId,
        requested_fuel: row.volume,
        fuel_grade: row.fuelType.toLowerCase() as 'petrol' | 'diesel',
        destination: row.destination.trim() || undefined,
      })),
      autoSend,
    );

    if (res.success && res.data) {
      const created = res.data.created;
      setRows(prev =>
        prev.map(r =>
          toSubmit.some(t => t.uid === r.uid)
            ? { ...r, status: 'success', message: autoSend ? 'Sent to OMC' : 'Draft created' }
            : r,
        ),
      );
      await fetchOrders();
      setIsSubmitting(false);
      setDone({ created, failed: 0 });
      toast.success(`${created} order(s) created successfully.`);
      return;
    }

    // Validation failure: nothing was created. Map per-row errors back to rows.
    setIsSubmitting(false);
    setDone({ created: 0, failed: toSubmit.length });

    if (res.rowErrors && res.rowErrors.length > 0) {
      const errorByUid = new Map(res.rowErrors.map(e => [toSubmit[e.index]?.uid, e.error]));
      setRows(prev =>
        prev.map(r =>
          errorByUid.has(r.uid)
            ? { ...r, status: 'error', message: errorByUid.get(r.uid) }
            : toSubmit.some(t => t.uid === r.uid)
              ? { ...r, status: 'idle', message: undefined }
              : r,
        ),
      );
      toast.error(`${res.rowErrors.length} row(s) need fixing — nothing was created.`);
    } else {
      setRows(prev =>
        prev.map(r => (toSubmit.some(t => t.uid === r.uid) ? { ...r, status: 'idle' } : r)),
      );
      toast.error(res.error || 'Bulk order failed — nothing was created.');
    }
  };

  const driverName = (id: string) => drivers.find(d => d.id === id)?.name ?? '';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1>
            <Layers size={22} style={{ verticalAlign: '-3px', marginRight: 8 }} />
            Bulk Order
          </h1>
          <p className="text-muted">Create fuel orders for multiple drivers at once.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bulk-toolbar">
        <button className="btn btn-outline btn-sm" onClick={addRow}>
          <Plus size={16} /> Add Row
        </button>
        <button className="btn btn-outline btn-sm" onClick={addRowPerDriver}>
          <Users size={16} /> Row Per Driver
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} /> Import CSV
        </button>
        <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}>
          <Download size={16} /> Template
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFileSelected}
          style={{ display: 'none' }}
        />
        <div className="bulk-toolbar-spacer" />
        <button className="btn btn-ghost btn-sm" onClick={clearAll}>
          Clear
        </button>
      </div>

      {/* Rows table */}
      <div className="table-wrapper">
        <table className="data-table bulk-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th style={{ width: 130 }}>Fuel Type</th>
              <th style={{ width: 150 }}>Volume (L)</th>
              <th style={{ width: 160 }}>Destination</th>
              <th style={{ width: 180 }}>Status</th>
              <th style={{ width: 50 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const own = optionsByDriver.get(row.driverId);
              const vehicleOptions = own
                ? [...own, ...poolOptions].sort((a, b) => byName(a.label, b.label))
                : poolOptions;
              // The selected vehicle's tank capacity is the fuel limit for this row.
              const selectedVehicle = vehicles.find(v => v.id === row.vehicleId);
              const capacity = selectedVehicle?.tankCapacity ?? 0;
              const overCapacity = capacity > 0 && row.volume > capacity;
              return (
                <tr key={row.uid} className={row.status === 'error' ? 'bulk-row-error' : ''}>
                  <td className="text-muted">{idx + 1}</td>
                  <td>
                    <SearchableSelect
                      options={driverOptions}
                      value={row.driverId}
                      onChange={v => handleDriverChange(row.uid, v)}
                      placeholder="— Select driver —"
                      searchPlaceholder="Search by name or phone..."
                      emptyText="No drivers match your search"
                      portal
                    />
                  </td>
                  <td>
                    <SearchableSelect
                      options={vehicleOptions}
                      value={row.vehicleId}
                      onChange={v => updateRow(row.uid, { vehicleId: v })}
                      placeholder="— Select vehicle —"
                      searchPlaceholder="Search by reg number or type..."
                      emptyText="No vehicles match your search"
                      portal
                    />
                  </td>
                  <td>
                    <select
                      value={row.fuelType}
                      onChange={e => updateRow(row.uid, { fuelType: e.target.value as FuelType })}
                    >
                      {FUEL_TYPES.map(ft => (
                        <option key={ft} value={ft}>
                          {ft}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={capacity > 0 ? capacity : undefined}
                      value={row.volume || ''}
                      placeholder="0"
                      onChange={e => updateRow(row.uid, { volume: Number(e.target.value) })}
                    />
                    {row.vehicleId && (
                      <div className={overCapacity ? 'text-danger bulk-limit-hint' : 'text-muted bulk-limit-hint'}>
                        {capacity > 0
                          ? `Limit: ${capacity.toLocaleString()} L`
                          : 'No tank limit set'}
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.destination}
                      placeholder="Optional"
                      onChange={e => updateRow(row.uid, { destination: e.target.value })}
                    />
                  </td>
                  <td>
                    {row.status === 'pending' && (
                      <span className="text-muted bulk-status">
                        <Loader2 size={14} className="animate-spin" /> Submitting…
                      </span>
                    )}
                    {row.status === 'success' && (
                      <span className="text-success bulk-status">
                        <CheckCircle2 size={14} /> {row.message}
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span className="text-danger bulk-status">
                        <AlertCircle size={14} /> {row.message}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeRow(row.uid)}
                      disabled={rows.length === 1}
                      aria-label={`Remove row for ${driverName(row.driverId) || idx + 1}`}
                      title="Remove row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary + submit */}
      <div className="bulk-footer">
        <div className="bulk-summary">
          <span className={filledRows.length > BULK_ORDER_LIMIT ? 'text-danger' : undefined}>
            <strong>{filledRows.length}</strong> / {BULK_ORDER_LIMIT} order{filledRows.length === 1 ? '' : 's'} ready
          </span>
          <span className="text-muted">·</span>
          <span>
            <strong>{totalVolume.toLocaleString()}</strong> L total
          </span>
          {done && (
            <span className={done.failed > 0 ? 'text-danger' : 'text-success'} style={{ marginLeft: 8 }}>
              {done.created} created{done.failed > 0 ? `, ${done.failed} failed` : ''}
            </span>
          )}
        </div>

        <div className="bulk-footer-actions">
          <label className="bulk-autosend">
            <input
              type="checkbox"
              checked={autoSend}
              onChange={e => setAutoSend(e.target.checked)}
            />
            Send to OMC immediately
          </label>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={isSubmitting || filledRows.length === 0 || filledRows.length > BULK_ORDER_LIMIT}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Send size={18} /> Create {filledRows.length} Order{filledRows.length === 1 ? '' : 's'}
              </>
            )}
          </button>
        </div>
      </div>

      {done && done.created > 0 && (
        <div className="bulk-done-actions">
          <button className="btn btn-outline" onClick={() => navigate('/dashboard/orders')}>
            View My Orders
          </button>
        </div>
      )}
    </div>
  );
}
