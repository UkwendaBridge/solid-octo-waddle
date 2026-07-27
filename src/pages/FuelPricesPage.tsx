import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import DevBanner from '../components/DevBanner';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import {
  TrendingUp,
  TrendingDown,
  Fuel,
  MapPin,
  Calendar,
  RefreshCw,
  Download,
} from 'lucide-react';

interface FuelPrice {
  id: string;
  stationId: string;
  stationName: string;
  fuelType: 'Petrol 93' | 'Petrol 95' | 'Diesel 50ppm' | 'Diesel 500ppm';
  currentPrice: number;
  previousPrice: number;
  effectiveDate: string;
  lastUpdated: string;
}

const MOCK_PRICES: FuelPrice[] = [
  {
    id: 'price-001',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    fuelType: 'Petrol 95',
    currentPrice: 24.89,
    previousPrice: 24.45,
    effectiveDate: '2026-03-06',
    lastUpdated: '2026-03-06T00:00:00',
  },
  {
    id: 'price-002',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    fuelType: 'Petrol 93',
    currentPrice: 24.67,
    previousPrice: 24.23,
    effectiveDate: '2026-03-06',
    lastUpdated: '2026-03-06T00:00:00',
  },
  {
    id: 'price-003',
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    fuelType: 'Diesel 50ppm',
    currentPrice: 23.45,
    previousPrice: 23.10,
    effectiveDate: '2026-03-06',
    lastUpdated: '2026-03-06T00:00:00',
  },
  {
    id: 'price-004',
    stationId: 'STN-002',
    stationName: 'Caltex Rosebank',
    fuelType: 'Petrol 95',
    currentPrice: 24.89,
    previousPrice: 24.45,
    effectiveDate: '2026-03-06',
    lastUpdated: '2026-03-06T00:00:00',
  },
  {
    id: 'price-005',
    stationId: 'STN-002',
    stationName: 'Caltex Rosebank',
    fuelType: 'Diesel 50ppm',
    currentPrice: 23.45,
    previousPrice: 23.10,
    effectiveDate: '2026-03-06',
    lastUpdated: '2026-03-06T00:00:00',
  },
  {
    id: 'price-006',
    stationId: 'STN-003',
    stationName: 'Engen Melrose',
    fuelType: 'Petrol 95',
    currentPrice: 24.85,
    previousPrice: 24.45,
    effectiveDate: '2026-03-06',
    lastUpdated: '2026-03-06T00:00:00',
  },
  {
    id: 'price-007',
    stationId: 'STN-003',
    stationName: 'Engen Melrose',
    fuelType: 'Diesel 50ppm',
    currentPrice: 23.40,
    previousPrice: 23.10,
    effectiveDate: '2026-03-06',
    lastUpdated: '2026-03-06T00:00:00',
  },
];

export default function FuelPricesPage() {
  const [prices] = useState<FuelPrice[]>(MOCK_PRICES);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // TODO: refetch prices once this page is wired to the API
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPriceChange = (current: number, previous: number) => {
    const change = current - previous;
    const pct = ((change / previous) * 100).toFixed(1);
    return { change, pct, isUp: change > 0 };
  };

  // Group by station
  const stationGroups = prices.reduce((acc, price) => {
    if (!acc[price.stationId]) {
      acc[price.stationId] = {
        stationName: price.stationName,
        stationId: price.stationId,
        prices: [],
      };
    }
    acc[price.stationId].prices.push(price);
    return acc;
  }, {} as Record<string, { stationName: string; stationId: string; prices: FuelPrice[] }>);

  const avgPetrol95 = prices
    .filter(p => p.fuelType === 'Petrol 95')
    .reduce((sum, p) => sum + p.currentPrice, 0) / prices.filter(p => p.fuelType === 'Petrol 95').length;

  const avgDiesel = prices
    .filter(p => p.fuelType === 'Diesel 50ppm')
    .reduce((sum, p) => sum + p.currentPrice, 0) / prices.filter(p => p.fuelType === 'Diesel 50ppm').length;

  return (
    <div className="page page-wide">
      <DevBanner />
      <PageHeader
        title="Fuel Prices"
        subtitle="Current fuel prices across all stations"
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

      {/* Average Prices */}
      <div className="stats-grid fade-in-up">
        <StatCard icon={<Fuel size={22} />} value={formatCurrency(avgPetrol95)} label="Avg Petrol 95" color="purple" />
        <StatCard icon={<Fuel size={22} />} value={formatCurrency(avgDiesel)} label="Avg Diesel 50ppm" color="blue" />
        <StatCard icon={<Calendar size={22} />} value="06 Mar 2026" label="Last Update" color="green" />
      </div>

      {/* Price Cards by Station */}
      <p className="section-label">Live Prices by Station</p>
      <div className="price-station-grid fade-in-up">
        {Object.values(stationGroups).map(group => (
          <div key={group.stationId} className="price-station-card">
            <div className="price-station-header">
              <MapPin size={16} />
              <span>{group.stationName}</span>
              <span className="cell-mono" style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                {group.stationId}
              </span>
            </div>
            <div className="price-list">
              {group.prices.map(price => {
                const { change, pct, isUp } = getPriceChange(price.currentPrice, price.previousPrice);
                return (
                  <div key={price.id} className="price-item">
                    <div className="price-fuel-type">
                      <span className={`fuel-badge fuel-${price.fuelType.toLowerCase().includes('petrol') ? 'petrol' : 'diesel'}`}>
                        {price.fuelType}
                      </span>
                    </div>
                    <div className="price-value">
                      <span className="price-current">{formatCurrency(price.currentPrice)}</span>
                      <span className={`price-change ${isUp ? 'price-up' : 'price-down'}`}>
                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isUp ? '+' : ''}{change.toFixed(2)} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
