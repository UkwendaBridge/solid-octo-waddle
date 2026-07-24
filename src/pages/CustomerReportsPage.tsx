/**
 * Customer Reports — scoped to the logged-in customer (customerOrders.getAll()
 * returns only their orders). Includes a consumption report: litres actually
 * dispensed per driver and per vehicle, from each order's litres_drawn.
 */
import { useEffect, useMemo, useState } from 'react';
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
  ChartCard, RangeFilter,
} from '../lib/reports';

export default function CustomerReportsPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>('30');
  const [showTable, setShowTable] = useState(false);

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

  const kpis = useMemo(() => {
    const ordered = inRange.reduce((s, o) => s + num(o.requested_fuel), 0);
    const consumed = inRange.reduce((s, o) => s + num(o.litres_drawn), 0);
    const by = (st: string) => inRange.filter((o) => o.status === st).length;
    return {
      total: inRange.length, ordered, consumed,
      pending: by('sent'), approved: by('approved'), completed: by('completed'),
    };
  }, [inRange]);

  const overTime = useMemo(() => litresOverTime(inRange), [inRange]);
  const byGrade = useMemo(() => volumeByGrade(inRange), [inRange]);
  const byStatus = useMemo(() => ordersByStatus(inRange), [inRange]);

  /* ── consumption: litres actually dispensed (litres_drawn) per entity ──── */
  const consumption = useMemo(() => {
    const driver = new Map<string, { litres: number; orders: number }>();
    const vehicle = new Map<string, { litres: number; orders: number }>();
    for (const o of inRange) {
      const drawn = num(o.litres_drawn);
      if (drawn <= 0) continue;
      const dName = o.driver_name || 'Unknown driver';
      const vName = o.registration_number || o.vehicle_registration || 'Unknown truck';
      const d = driver.get(dName) || { litres: 0, orders: 0 };
      d.litres += drawn; d.orders += 1; driver.set(dName, d);
      const v = vehicle.get(vName) || { litres: 0, orders: 0 };
      v.litres += drawn; v.orders += 1; vehicle.set(vName, v);
    }
    const rank = (m: Map<string, { litres: number; orders: number }>) =>
      [...m.entries()].map(([name, x]) => ({ name, ...x })).sort((a, b) => b.litres - a.litres);
    return { byDriver: rank(driver), byVehicle: rank(vehicle) };
  }, [inRange]);

  if (loading) return <div className="page"><div className="section" style={{ padding: 40, textAlign: 'center', color: INK_MUTED }}>Loading reports…</div></div>;
  if (error) return <div className="page"><div className="section" style={{ padding: 24, color: C.red }}>{error}</div></div>;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><BarChart3 size={26} /> Reports</h1>
          <p style={{ color: INK_MUTED, margin: '4px 0 0' }}>Your orders and fuel consumption</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <RangeFilter range={range} onChange={setRange} />
          <button className="btn btn-secondary" onClick={() => setShowTable((v) => !v)}>
            {showTable ? 'Show charts' : 'Show table'}
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginTop: 8 }}>
        <StatCard icon={<ClipboardList size={22} />} value={kpis.total} label="Orders" color="purple" />
        <StatCard icon={<Droplets size={22} />} value={fmtL(kpis.ordered)} label="Litres ordered" color="blue" />
        <StatCard icon={<Fuel size={22} />} value={fmtL(kpis.consumed)} label="Fuel consumed" color="green" />
        <StatCard icon={<Clock size={22} />} value={kpis.pending} label="Pending" color="yellow" />
        <StatCard icon={<CheckCircle2 size={22} />} value={kpis.approved} label="Approved" color="green" />
        <StatCard icon={<TrendingUp size={22} />} value={kpis.completed} label="Completed" color="purple" />
      </div>

      {showTable ? (
        <TableView overTime={overTime} byGrade={byGrade} byStatus={byStatus} consumption={consumption} />
      ) : (
        <>
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

          {/* consumption report — the headline for a fleet owner */}
          <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <ChartCard title="Fuel consumed by driver" subtitle="Litres dispensed (top 8)">
              <ConsumptionBars data={consumption.byDriver.slice(0, 8)} />
            </ChartCard>
            <ChartCard title="Fuel consumed by vehicle" subtitle="Litres dispensed per truck (top 8)">
              <ConsumptionBars data={consumption.byVehicle.slice(0, 8)} />
            </ChartCard>

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
          </div>
        </>
      )}
    </div>
  );
}

function ConsumptionBars({ data }: { data: { name: string; litres: number }[] }) {
  if (data.length === 0) return <div style={{ padding: 24, color: INK_MUTED, fontSize: 14 }}>No fuel dispensed in this period yet.</div>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 34 + 20)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={{ fill: INK_MUTED, fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={130} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltip} formatter={((v: number) => [fmtL(Number(v)), 'Consumed']) as never} />
        <Bar dataKey="litres" fill={C.green} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TableView({ overTime, byGrade, byStatus, consumption }: {
  overTime: { label: string; orders: number; litres: number }[];
  byGrade: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  consumption: { byDriver: { name: string; litres: number; orders: number }[]; byVehicle: { name: string; litres: number; orders: number }[] };
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
      <ChartCard title="Consumption by driver" subtitle="Litres actually dispensed" />
      <T head={['Driver', 'Orders', 'Litres consumed']} rows={consumption.byDriver.map((d) => [d.name, d.orders, fmtL(d.litres)])} />
      <ChartCard title="Consumption by vehicle" subtitle="Litres actually dispensed" />
      <T head={['Truck', 'Orders', 'Litres consumed']} rows={consumption.byVehicle.map((d) => [d.name, d.orders, fmtL(d.litres)])} />
      <ChartCard title="Daily totals" />
      <T head={['Day', 'Orders', 'Litres ordered']} rows={overTime.map((d) => [d.label, d.orders, fmtL(d.litres)])} />
      <ChartCard title="By fuel grade" />
      <T head={['Grade', 'Litres']} rows={byGrade.map((d) => [d.name, fmtL(d.value)])} />
      <ChartCard title="By status" />
      <T head={['Status', 'Orders']} rows={byStatus.map((d) => [d.name, d.value])} />
    </>
  );
}
