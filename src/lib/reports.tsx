/**
 * Shared building blocks for the report pages (OMC + customer), so the two
 * never drift. Palette follows the data-viz method: categorical slots for
 * identity, the reserved status palette for order state, single hue for
 * magnitude; no dual-axis anywhere.
 */
import type { ReactNode } from 'react';
import type { BackendOrder } from '../types/api';

/* ── palette (validated reference instance, light surface) ──────────────── */
export const INK = '#393a3d';
export const INK_MUTED = '#8d9096';
export const GRID = '#e8eaed';
export const C = {
  diesel: '#2a78d6',   // categorical slot 1
  petrol: '#eb6834',   // categorical slot 2
  blue: '#2a78d6',
  green: '#0ca30c',    // status good
  amber: '#fab219',    // status warning
  red: '#d03b3b',      // status critical
  slate: '#8d9096',    // neutral
};
export const STATUS_COLOR: Record<string, string> = {
  approved: C.green, completed: C.blue, sent: C.amber, draft: C.slate, rejected: C.red,
};
export const STATUS_LABEL: Record<string, string> = {
  approved: 'Approved', completed: 'Completed', sent: 'Pending', draft: 'Draft', rejected: 'Rejected',
};

export const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
export const fmtL = (v: number) => `${v.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`;

/* ── recharts chrome ────────────────────────────────────────────────────── */
export const tooltip = {
  cursor: { fill: 'rgba(0,0,0,0.04)' },
  contentStyle: { borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxShadow: 'var(--shadow)' },
  labelStyle: { color: INK, fontWeight: 600 },
} as const;
export const legend = { iconType: 'circle', wrapperStyle: { fontSize: 13, color: INK } } as const;

/* ── date range ─────────────────────────────────────────────────────────── */
export type RangeKey = '7' | '30' | '90' | 'all';
export const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
];
export function filterByRange(orders: BackendOrder[], range: RangeKey): BackendOrder[] {
  if (range === 'all') return orders;
  const cutoff = Date.now() - Number(range) * 86400_000;
  return orders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
}

/* ── aggregations shared by both pages ──────────────────────────────────── */
export function litresOverTime(orders: BackendOrder[]) {
  const m = new Map<string, { date: string; orders: number; litres: number }>();
  for (const o of orders) {
    const day = new Date(o.created_at).toISOString().slice(0, 10);
    const e = m.get(day) || { date: day, orders: 0, litres: 0 };
    e.orders += 1;
    e.litres += num(o.requested_fuel);
    m.set(day, e);
  }
  return [...m.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, label: d.date.slice(5) }));
}

export function volumeByGrade(orders: BackendOrder[]) {
  let petrol = 0, diesel = 0;
  for (const o of orders) {
    const g = String(o.fuel_grade || '').toLowerCase();
    if (g === 'diesel') diesel += num(o.requested_fuel); else petrol += num(o.requested_fuel);
  }
  return [
    { name: 'Diesel', value: diesel, fill: C.diesel },
    { name: 'Petrol', value: petrol, fill: C.petrol },
  ].filter((d) => d.value > 0);
}

export function ordersByStatus(orders: BackendOrder[]) {
  const m = new Map<string, number>();
  for (const o of orders) m.set(o.status, (m.get(o.status) || 0) + 1);
  return [...m.entries()]
    .map(([status, value]) => ({ status, name: STATUS_LABEL[status] || status, value, fill: STATUS_COLOR[status] || C.slate }))
    .sort((a, b) => b.value - a.value);
}

/* ── shared UI ──────────────────────────────────────────────────────────── */
export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
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

export function RangeFilter({ range, onChange }: { range: RangeKey; onChange: (r: RangeKey) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
      {RANGES.map((r) => (
        <button key={r.key} onClick={() => onChange(r.key)}
          style={{
            border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: range === r.key ? 'var(--qb-green)' : 'transparent',
            color: range === r.key ? '#fff' : INK,
          }}>{r.label}</button>
      ))}
    </div>
  );
}
