import { useState } from 'react';
import { formatDateTimeShort as formatDateTime } from '../utils/format';
import DevBanner from '../components/DevBanner';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import PageToolbar from '../components/PageToolbar';
import {
  Fuel,
  Droplets,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
} from 'lucide-react';

interface TankData {
  id: string;
  stationName: string;
  stationId: string;
  tankNumber: string;
  fuelType: 'Petrol' | 'Diesel';
  capacity: number;
  currentLevel: number;
  lastUpdated: string;
  status: 'normal' | 'low' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

const MOCK_TANKS: TankData[] = [
  {
    id: 'tank-001',
    stationName: 'Shell Sandton City',
    stationId: 'STN-001',
    tankNumber: 'Tank 1',
    fuelType: 'Petrol',
    capacity: 50000,
    currentLevel: 42500,
    lastUpdated: '2026-03-11T10:30:00',
    status: 'normal',
    trend: 'down',
  },
  {
    id: 'tank-002',
    stationName: 'Shell Sandton City',
    stationId: 'STN-001',
    tankNumber: 'Tank 2',
    fuelType: 'Diesel',
    capacity: 50000,
    currentLevel: 8500,
    lastUpdated: '2026-03-11T10:30:00',
    status: 'low',
    trend: 'down',
  },
  {
    id: 'tank-003',
    stationName: 'Caltex Rosebank',
    stationId: 'STN-002',
    tankNumber: 'Tank 1',
    fuelType: 'Petrol',
    capacity: 40000,
    currentLevel: 35200,
    lastUpdated: '2026-03-11T10:25:00',
    status: 'normal',
    trend: 'stable',
  },
  {
    id: 'tank-004',
    stationName: 'Caltex Rosebank',
    stationId: 'STN-002',
    tankNumber: 'Tank 2',
    fuelType: 'Diesel',
    capacity: 40000,
    currentLevel: 3200,
    lastUpdated: '2026-03-11T10:25:00',
    status: 'critical',
    trend: 'down',
  },
  {
    id: 'tank-005',
    stationName: 'Engen Melrose',
    stationId: 'STN-003',
    tankNumber: 'Tank 1',
    fuelType: 'Petrol',
    capacity: 45000,
    currentLevel: 41000,
    lastUpdated: '2026-03-11T10:20:00',
    status: 'normal',
    trend: 'up',
  },
  {
    id: 'tank-006',
    stationName: 'Engen Melrose',
    stationId: 'STN-003',
    tankNumber: 'Tank 2',
    fuelType: 'Diesel',
    capacity: 45000,
    currentLevel: 28000,
    lastUpdated: '2026-03-11T10:20:00',
    status: 'normal',
    trend: 'down',
  },
];

type FilterStatus = 'all' | 'normal' | 'low' | 'critical';

export default function TankLevelsPage() {
  const [tanks] = useState<TankData[]>(MOCK_TANKS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const normalCount = tanks.filter(t => t.status === 'normal').length;
  const lowCount = tanks.filter(t => t.status === 'low').length;
  const criticalCount = tanks.filter(t => t.status === 'critical').length;

  const filteredTanks = tanks.filter(t => {
    const matchesSearch =
      search === '' ||
      t.stationName.toLowerCase().includes(search.toLowerCase()) ||
      t.stationId.toLowerCase().includes(search.toLowerCase()) ||
      t.tankNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  };

  const formatVolume = (litres: number) => {
    return `${(litres / 1000).toFixed(1)}k L`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // TODO: refetch tank levels once this page is wired to the API
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="page page-wide">
      <DevBanner />
      <PageHeader
        title="Tank Levels"
        subtitle="Real-time fuel tank monitoring across all stations"
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="btn btn-outline">
              <Download size={16} />
              Export
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="stats-grid fade-in-up">
        <StatCard icon={<Droplets size={22} />} value={normalCount} label="Normal Levels" color="green" />
        <StatCard icon={<AlertTriangle size={22} />} value={lowCount} label="Low Stock" color="yellow" />
        <StatCard icon={<AlertTriangle size={22} />} value={criticalCount} label="Critical" color="red" />
      </div>

      {/* Toolbar */}
      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by station or tank..."
      />
      <div className="tab-filters">
        <button className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All Tanks</button>
        <button className={`tab-btn ${filterStatus === 'normal' ? 'active' : ''}`} onClick={() => setFilterStatus('normal')}>Normal</button>
        <button className={`tab-btn ${filterStatus === 'low' ? 'active' : ''}`} onClick={() => setFilterStatus('low')}>Low Stock</button>
        <button className={`tab-btn ${filterStatus === 'critical' ? 'active' : ''}`} onClick={() => setFilterStatus('critical')}>Critical</button>
      </div>

      {/* Tank Cards Grid */}
      <div className="tank-grid">
        {filteredTanks.map(tank => {
          const pct = getPercentage(tank.currentLevel, tank.capacity);
          return (
            <div key={tank.id} className={`tank-card tank-${tank.status}`}>
              <div className="tank-card-header">
                <div>
                  <span className="tank-station">{tank.stationName}</span>
                  <span className="tank-id">{tank.stationId} · {tank.tankNumber}</span>
                </div>
                <span className={`fuel-badge fuel-${tank.fuelType.toLowerCase()}`}>
                  {tank.fuelType}
                </span>
              </div>

              <div className="tank-gauge-container">
                <div className="tank-gauge">
                  <div
                    className={`tank-gauge-fill tank-fill-${tank.status}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <div className="tank-gauge-info">
                  <span className="tank-percentage">{pct}%</span>
                  <span className="tank-volume">{formatVolume(tank.currentLevel)}</span>
                  <span className="tank-capacity">of {formatVolume(tank.capacity)}</span>
                </div>
              </div>

              <div className="tank-card-footer">
                <div className="tank-trend">
                  {tank.trend === 'up' && <TrendingUp size={14} className="text-success" />}
                  {tank.trend === 'down' && <TrendingDown size={14} className="text-danger" />}
                  {tank.trend === 'stable' && <span className="text-muted">—</span>}
                </div>
                <span className="tank-updated">Updated {formatDateTime(tank.lastUpdated)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTanks.length === 0 && (
        <EmptyState icon={<Fuel size={48} />} description="No tanks found matching your criteria" />
      )}
    </div>
  );
}
