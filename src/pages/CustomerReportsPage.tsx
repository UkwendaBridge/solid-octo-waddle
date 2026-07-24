/**
 * Customer Reports — one mounted component for /dashboard/reports/*, so orders
 * are fetched once and the active view is derived from the URL:
 *   /reports              → Overview
 *   /reports/detailed     → Detailed report (every order)
 *   /reports/consumption  → Consumption report (litres dispensed per driver/truck)
 *   /reports/destination  → Destination report (litres by destination)
 * Scoped to the logged-in customer via customerOrders.getAll().
 */
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { BarChart3, ClipboardList, Droplets, Fuel, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import { customerOrders } from '../services/api';
import type { BackendOrder } from '../types/api';
import {
  C, INK, INK_MUTED, GRID, num, fmtL, tooltip, legend,
  type RangeKey, filterByRange, litresOverTime, volumeByGrade, ordersByStatus,
  ChartCard, RangeFilter, STATUS_LABEL,
} from '../lib/reports';

type Section = 'overview' | 'detailed' | 'consumption' | 'destination';
const TABS: { to: string; label: string; section: Section; end?: boolean }[] = [
  { to: '/dashboard/reports', label: 'Overview', section: 'overview', end: true },
  { to: '/dashboard/reports/detailed', label: 'Detailed', section: 'detailed' },
  { to: '/dashboard/reports/consumption', label: 'Consumption', section: 'consumption' },
  { to: '/dashboard/reports/destination', label: 'Destination', section: 'destination' },
];

export default function CustomerReportsPage() {
  const location = useLocation();
  const seg = location.pathname.replace(/\/+$/, '').split('/').pop();
  const section: Section = (['detailed', 'consumption', 'destination'].includes(seg || '') ? seg : 'overview') as Section;

  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>('30');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await customerOrders.getAll();
        if (!alive) return;
        if (res.success && res.data) setOrders(res.data.orders || []);
        else setError(res.error || 'Failed to load orders');
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load orders');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const inRange = useMemo(() => filterByRange(orders, range), [orders, range]);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><BarChart3 size={26} /> Reports</h1>
          <p style={{ color: INK_MUTED, margin: '4px 0 0' }}>Your orders, consumption and destinations</p>
        </div>
        <RangeFilter range={range} onChange={setRange} />
      </div>

      {/* in-page tabs — mirror the sidebar dropdown */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginTop: 12, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
            style={({ isActive }) => ({
              padding: '10px 16px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
              color: isActive ? 'var(--qb-green)' : INK_MUTED,
              borderBottom: isActive ? '2px solid var(--qb-green)' : '2px solid transparent',
              marginBottom: -1,
            })}>{t.label}</NavLink>
        ))}
      </div>

      {loading ? (
        <div className="section" style={{ padding: 40, textAlign: 'center', color: INK_MUTED }}>Loading…</div>
      ) : error ? (
        <div className="section" style={{ padding: 24, color: C.red }}>{error}</div>
      ) : (
        <>
          {section === 'overview' && <Overview inRange={inRange} />}
          {section === 'detailed' && <Detailed inRange={inRange} />}
          {section === 'consumption' && <Consumption inRange={inRange} />}
          {section === 'destination' && <Destination inRange={inRange} />}
        </>
      )}
    </div>
  );
}

/* ── Overview ────────────────────────────────────────────────────────────── */
function Overview({ inRange }: { inRange: BackendOrder[] }) {
  const kpis = useMemo(() => {
    const ordered = inRange.reduce((s, o) => s + num(o.requested_fuel), 0);
    const consumed = inRange.reduce((s, o) => s + num(o.litres_drawn), 0);
    const by = (st: string) => inRange.filter((o) => o.status === st).length;
    return { total: inRange.length, ordered, consumed, pending: by('sent'), approved: by('approved'), completed: by('completed') };
  }, [inRange]);
  const overTime = useMemo(() => litresOverTime(inRange), [inRange]);
  const byGrade = useMemo(() => volumeByGrade(inRange), [inRange]);
  const byStatus = useMemo(() => ordersByStatus(inRange), [inRange]);

  return (
    <>
      <div className="stats-grid" style={{ marginTop: 16 }}>
        <StatCard icon={<ClipboardList size={22} />} value={kpis.total} label="Orders" color="purple" />
        <StatCard icon={<Droplets size={22} />} value={fmtL(kpis.ordered)} label="Litres ordered" color="blue" />
        <StatCard icon={<Fuel size={22} />} value={fmtL(kpis.consumed)} label="Fuel consumed" color="green" />
        <StatCard icon={<Clock size={22} />} value={kpis.pending} label="Pending" color="yellow" />
        <StatCard icon={<CheckCircle2 size={22} />} value={kpis.approved} label="Approved" color="green" />
        <StatCard icon={<TrendingUp size={22} />} value={kpis.completed} label="Completed" color="purple" />
      </div>

      <ChartCard title="Litres ordered over time" subtitle="Daily total requested fuel">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={overTime} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="cLitres" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.blue} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip {...tooltip} formatter={((v: number) => [fmtL(Number(v)), 'Litres']) as never} />
            <Area type="monotone" dataKey="litres" stroke={C.blue} strokeWidth={2} fill="url(#cLitres)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <ChartCard title="Volume by fuel grade" subtitle="Share of litres ordered">
          <Donut data={byGrade} valueLabel={(v) => fmtL(v)} />
        </ChartCard>
        <ChartCard title="Orders by status" subtitle="Current lifecycle state">
          <Donut data={byStatus} valueLabel={(v) => `${v} orders`} />
        </ChartCard>
      </div>
    </>
  );
}

/* ── Detailed ────────────────────────────────────────────────────────────── */
function Detailed({ inRange }: { inRange: BackendOrder[] }) {
  const rows = useMemo(() => [...inRange].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [inRange]);
  return (
    <ChartCard title="All orders" subtitle={`${rows.length} order(s) in range`}>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontVariantNumeric: 'tabular-nums' }}>
          <thead><tr>
            {['Date', 'Driver', 'Truck', 'Destination', 'Grade', 'Ordered', 'Dispensed', 'Status'].map((h) => <th key={h} style={{ textAlign: 'left' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>{o.driver_name || '—'}</td>
                <td>{o.registration_number || o.vehicle_registration || '—'}</td>
                <td>{o.destination || <span style={{ color: INK_MUTED }}>Unspecified</span>}</td>
                <td style={{ textTransform: 'capitalize' }}>{o.fuel_grade}</td>
                <td>{fmtL(num(o.requested_fuel))}</td>
                <td>{fmtL(num(o.litres_drawn))}</td>
                <td>{STATUS_LABEL[o.status] || o.status}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} style={{ color: INK_MUTED, padding: 20 }}>No orders in this period.</td></tr>}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

/* ── Consumption ─────────────────────────────────────────────────────────── */
function Consumption({ inRange }: { inRange: BackendOrder[] }) {
  const { byDriver, byVehicle } = useMemo(() => {
    const driver = new Map<string, { litres: number; orders: number }>();
    const vehicle = new Map<string, { litres: number; orders: number }>();
    for (const o of inRange) {
      const drawn = num(o.litres_drawn);
      if (drawn <= 0) continue;
      const dName = o.driver_name || 'Unknown driver';
      const vName = o.registration_number || o.vehicle_registration || 'Unknown truck';
      const d = driver.get(dName) || { litres: 0, orders: 0 }; d.litres += drawn; d.orders += 1; driver.set(dName, d);
      const v = vehicle.get(vName) || { litres: 0, orders: 0 }; v.litres += drawn; v.orders += 1; vehicle.set(vName, v);
    }
    const rank = (m: Map<string, { litres: number; orders: number }>) =>
      [...m.entries()].map(([name, x]) => ({ name, ...x })).sort((a, b) => b.litres - a.litres);
    return { byDriver: rank(driver), byVehicle: rank(vehicle) };
  }, [inRange]);

  return (
    <>
      <p className="text-muted" style={{ marginTop: 16 }}>Litres actually dispensed (from each order's recorded fills).</p>
      <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <ChartCard title="Consumed by driver" subtitle="Top 8 by litres dispensed">
          <HBars data={byDriver.slice(0, 8)} />
        </ChartCard>
        <ChartCard title="Consumed by vehicle" subtitle="Top 8 trucks by litres dispensed">
          <HBars data={byVehicle.slice(0, 8)} />
        </ChartCard>
      </div>
      <ChartCard title="Consumption by driver" subtitle="Full list">
        <SimpleTable head={['Driver', 'Orders', 'Litres consumed']} rows={byDriver.map((d) => [d.name, d.orders, fmtL(d.litres)])} />
      </ChartCard>
      <ChartCard title="Consumption by vehicle" subtitle="Full list">
        <SimpleTable head={['Truck', 'Orders', 'Litres consumed']} rows={byVehicle.map((d) => [d.name, d.orders, fmtL(d.litres)])} />
      </ChartCard>
    </>
  );
}

/* ── Destination ─────────────────────────────────────────────────────────── */
function Destination({ inRange }: { inRange: BackendOrder[] }) {
  const byDest = useMemo(() => {
    const m = new Map<string, { destination: string; orders: number; ordered: number; consumed: number }>();
    for (const o of inRange) {
      const dest = (o.destination && String(o.destination).trim()) || 'Unspecified';
      const e = m.get(dest) || { destination: dest, orders: 0, ordered: 0, consumed: 0 };
      e.orders += 1; e.ordered += num(o.requested_fuel); e.consumed += num(o.litres_drawn);
      m.set(dest, e);
    }
    return [...m.values()].sort((a, b) => b.consumed - a.consumed || b.ordered - a.ordered);
  }, [inRange]);

  const hasReal = byDest.some((d) => d.destination !== 'Unspecified');

  return (
    <>
      {!hasReal && (
        <div className="section" style={{ marginTop: 16, color: INK_MUTED }}>
          No destinations captured yet. Add a destination when placing an order and it will appear here.
        </div>
      )}
      <ChartCard title="Fuel by destination" subtitle="Litres consumed per destination (top 10)">
        <HBars data={byDest.slice(0, 10).map((d) => ({ name: d.destination, litres: d.consumed, orders: d.orders }))} />
      </ChartCard>
      <ChartCard title="Destination breakdown" subtitle="Orders, litres ordered and consumed">
        <SimpleTable
          head={['Destination', 'Orders', 'Litres ordered', 'Litres consumed']}
          rows={byDest.map((d) => [d.destination, d.orders, fmtL(d.ordered), fmtL(d.consumed)])}
        />
      </ChartCard>
    </>
  );
}

/* ── small shared render helpers (local) ─────────────────────────────────── */
function Donut({ data, valueLabel }: { data: { name: string; value: number; fill: string }[]; valueLabel: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} strokeWidth={2} stroke="var(--bg-surface)">
          {data.map((d, i) => <Cell key={`${d.name}-${i}`} fill={d.fill} />)}
        </Pie>
        <Tooltip {...tooltip} formatter={((v: number, n: string) => [valueLabel(Number(v)), n]) as never} />
        <Legend {...legend} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function HBars({ data }: { data: { name: string; litres: number }[] }) {
  if (data.length === 0) return <div style={{ padding: 24, color: INK_MUTED, fontSize: 14 }}>No fuel dispensed in this period yet.</div>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 34 + 20)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltip} formatter={((v: number) => [fmtL(Number(v)), 'Consumed']) as never} />
        <Bar dataKey="litres" fill={C.green} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ width: '100%', fontVariantNumeric: 'tabular-nums' }}>
        <thead><tr>{head.map((h) => <th key={h} style={{ textAlign: 'left' }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
          {rows.length === 0 && <tr><td colSpan={head.length} style={{ color: INK_MUTED, padding: 16 }}>No data in this period.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
