/**
 * OMC Reports — analytics over every order, computed client-side from
 * omcOrders.getAll(). No new backend endpoint needed.
 *
 * Chart-colour notes (per the data-viz method):
 *  - Fuel grade is a 2-category split → categorical slots 1 & 2 of the validated
 *    reference palette (blue #2a78d6, orange #eb6834), within the ≤3 all-pairs cap.
 *  - Order status is a STATE dimension → the reserved status palette
 *    (good/warning/critical) plus neutral steps, and every slice is labelled +
 *    legended so state is never colour-alone.
 *  - "Over time" and "top customers" are single-measure magnitude → one hue each,
 *    no dual-axis anywhere (orders/day and litres/day are separate charts).
 * A table view is provided for every chart section (accessibility).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { BarChart as BarChartIcon, ClipboardList, Droplets, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import { omcOrders } from '../services/api';
import type { BackendOrder } from '../types/api';

/* ── palette (validated reference instance, light surface) ──────────────── */
const INK = '#393a3d';
const INK_MUTED = '#8d9096';
const GRID = '#e8eaed';
const C = {
  diesel: '#2a78d6',   // categorical slot 1
  petrol: '#eb6834',   // categorical slot 2
  blue: '#2a78d6',
  green: '#0ca30c',    // status good
  amber: '#fab219',    // status warning
  red: '#d03b3b',      // status critical
  slate: '#8d9096',    // neutral
};
const STATUS_COLOR: Record<string, string> = {
  approved: C.green, completed: C.blue, sent: C.amber, draft: C.slate, rejected: C.red,
};
const STATUS_LABEL: Record<string, string> = {
  approved: 'Approved', completed: 'Completed', sent: 'Pending', draft: 'Draft', rejected: 'Rejected',
};

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
const fmtL = (v: number) => `${v.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`;

type RangeKey = '7' | '30' | '90' | 'all';
const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
];

export default function OmcReportsPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>('30');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await omcOrders.getAll();
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

  const inRange = useMemo(() => {
    if (range === 'all') return orders;
    const cutoff = Date.now() - Number(range) * 86400_000;
    return orders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
  }, [orders, range]);

  /* ── aggregates ──────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const litres = inRange.reduce((s, o) => s + num(o.requested_fuel), 0);
    const drawn = inRange.reduce((s, o) => s + num(o.litres_drawn), 0);
    const by = (st: string) => inRange.filter((o) => o.status === st).length;
    return {
      total: inRange.length,
      litres,
      drawn,
      approved: by('approved'),
      pending: by('sent'),
      completed: by('completed'),
    };
  }, [inRange]);

  const overTime = useMemo(() => {
    const m = new Map<string, { date: string; orders: number; litres: number }>();
    for (const o of inRange) {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      const e = m.get(day) || { date: day, orders: 0, litres: 0 };
      e.orders += 1;
      e.litres += num(o.requested_fuel);
      m.set(day, e);
    }
    return [...m.values()].sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, label: d.date.slice(5) }));
  }, [inRange]);

  const byGrade = useMemo(() => {
    let petrol = 0, diesel = 0;
    for (const o of inRange) {
      const g = String(o.fuel_grade || '').toLowerCase();
      if (g === 'diesel') diesel += num(o.requested_fuel); else petrol += num(o.requested_fuel);
    }
    return [
      { name: 'Diesel', value: diesel, fill: C.diesel },
      { name: 'Petrol', value: petrol, fill: C.petrol },
    ].filter((d) => d.value > 0);
  }, [inRange]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of inRange) m.set(o.status, (m.get(o.status) || 0) + 1);
    return [...m.entries()]
      .map(([status, value]) => ({ status, name: STATUS_LABEL[status] || status, value, fill: STATUS_COLOR[status] || C.slate }))
      .sort((a, b) => b.value - a.value);
  }, [inRange]);

  const topCustomers = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of inRange) {
      const name = o.customer_name || 'Unknown';
      m.set(name, (m.get(name) || 0) + num(o.requested_fuel));
    }
    return [...m.entries()].map(([name, litres]) => ({ name, litres }))
      .sort((a, b) => b.litres - a.litres).slice(0, 8);
  }, [inRange]);

  if (loading) return <div className="page"><div className="section" style={{ padding: 40, textAlign: 'center', color: INK_MUTED }}>Loading reports…</div></div>;
  if (error) return <div className="page"><div className="section" style={{ padding: 24, color: C.red }}>{error}</div></div>;

  return (
    <div className="page">
      {/* header + range filter */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><BarChartIcon size={26} /> Reports</h1>
          <p style={{ color: INK_MUTED, margin: '4px 0 0' }}>Order and fuel-volume analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)}
                style={{
                  border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: range === r.key ? 'var(--qb-green)' : 'transparent',
                  color: range === r.key ? '#fff' : INK,
                }}>{r.label}</button>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => setShowTable((v) => !v)}>
            {showTable ? 'Show charts' : 'Show table'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{ marginTop: 8 }}>
        <StatCard icon={<ClipboardList size={22} />} value={kpis.total} label="Orders" color="purple" />
        <StatCard icon={<Droplets size={22} />} value={fmtL(kpis.litres)} label="Litres ordered" color="blue" />
        <StatCard icon={<TrendingUp size={22} />} value={fmtL(kpis.drawn)} label="Litres dispensed" color="green" />
        <StatCard icon={<Clock size={22} />} value={kpis.pending} label="Pending approval" color="yellow" />
        <StatCard icon={<CheckCircle2 size={22} />} value={kpis.approved} label="Approved" color="green" />
        <StatCard icon={<TrendingUp size={22} />} value={kpis.completed} label="Completed" color="purple" />
      </div>

      {showTable ? (
        <TableView overTime={overTime} byGrade={byGrade} byStatus={byStatus} topCustomers={topCustomers} />
      ) : (
        <>
          {/* litres over time */}
          <ChartCard title="Litres ordered over time" subtitle="Daily total requested fuel">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={overTime} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gLitres" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.blue} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
                <Tooltip {...tooltip} formatter={((v: number) => [fmtL(Number(v)), 'Litres']) as never} />
                <Area type="monotone" dataKey="litres" stroke={C.blue} strokeWidth={2} fill="url(#gLitres)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* orders per day */}
            <ChartCard title="Orders per day" subtitle="Order count by day">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={overTime} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis allowDecimals={false} tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip {...tooltip} formatter={((v: number) => [v, 'Orders']) as never} />
                  <Bar dataKey="orders" fill="var(--qb-green)" radius={[4, 4, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* fuel grade split */}
            <ChartCard title="Volume by fuel grade" subtitle="Share of litres ordered">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byGrade} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} strokeWidth={2} stroke="var(--bg-surface)">
                    {byGrade.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                  <Tooltip {...tooltip} formatter={((v: number, n: string) => [fmtL(Number(v)), n]) as never} />
                  <Legend {...legend} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* status breakdown */}
            <ChartCard title="Orders by status" subtitle="Current lifecycle state">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} strokeWidth={2} stroke="var(--bg-surface)">
                    {byStatus.map((d) => <Cell key={d.status} fill={d.fill} />)}
                  </Pie>
                  <Tooltip {...tooltip} formatter={((v: number, n: string) => [`${v} orders`, n]) as never} />
                  <Legend {...legend} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* top customers */}
            <ChartCard title="Top customers by volume" subtitle="Litres ordered (top 8)">
              <ResponsiveContainer width="100%" height={Math.max(260, topCustomers.length * 34 + 20)}>
                <BarChart data={topCustomers} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltip} formatter={((v: number) => [fmtL(Number(v)), 'Litres']) as never} />
                  <Bar dataKey="litres" fill={C.blue} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

/* ── shared bits ─────────────────────────────────────────────────────────── */
const tooltip = {
  cursor: { fill: 'rgba(0,0,0,0.04)' },
  contentStyle: { borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxShadow: 'var(--shadow)' },
  labelStyle: { color: INK, fontWeight: 600 },
} as const;
const legend = { iconType: 'circle', wrapperStyle: { fontSize: 13, color: INK } } as const;

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="section" style={{ marginTop: 16 }}>
      <div className="section-header" style={{ marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ color: INK_MUTED, fontSize: 13, margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function TableView({ overTime, byGrade, byStatus, topCustomers }: {
  overTime: { label: string; orders: number; litres: number }[];
  byGrade: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  topCustomers: { name: string; litres: number }[];
}) {
  const T = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
    <div className="section" style={{ marginTop: 16, overflowX: 'auto' }}>
      <table className="data-table" style={{ width: '100%', fontVariantNumeric: 'tabular-nums' }}>
        <thead><tr>{head.map((h) => <th key={h} style={{ textAlign: 'left' }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
  return (
    <>
      <ChartCard title="Daily totals" />
      <T head={['Day', 'Orders', 'Litres']} rows={overTime.map((d) => [d.label, d.orders, fmtL(d.litres)])} />
      <ChartCard title="By fuel grade" />
      <T head={['Grade', 'Litres']} rows={byGrade.map((d) => [d.name, fmtL(d.value)])} />
      <ChartCard title="By status" />
      <T head={['Status', 'Orders']} rows={byStatus.map((d) => [d.name, d.value])} />
      <ChartCard title="Top customers" />
      <T head={['Customer', 'Litres']} rows={topCustomers.map((d) => [d.name, fmtL(d.litres)])} />
    </>
  );
}
