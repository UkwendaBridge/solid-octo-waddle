import { useState } from 'react';
import DevBanner from '../components/DevBanner';
import PageHeader from '../components/PageHeader';
import {
  DollarSign,
  Save,
  AlertCircle,
  Check,
  MapPin,
  Loader2,
} from 'lucide-react';

interface PriceEntry {
  fuelType: string;
  currentPrice: number;
  newPrice: string;
}

interface StationPrices {
  stationId: string;
  stationName: string;
  prices: PriceEntry[];
}

const STATIONS = [
  { id: 'ALL', name: 'All Stations' },
  { id: 'STN-001', name: 'Shell Sandton City' },
  { id: 'STN-002', name: 'Caltex Rosebank' },
  { id: 'STN-003', name: 'Engen Melrose' },
];

const MOCK_STATION_PRICES: StationPrices[] = [
  {
    stationId: 'STN-001',
    stationName: 'Shell Sandton City',
    prices: [
      { fuelType: 'Petrol 95', currentPrice: 24.89, newPrice: '' },
      { fuelType: 'Petrol 93', currentPrice: 24.67, newPrice: '' },
      { fuelType: 'Diesel 50ppm', currentPrice: 23.45, newPrice: '' },
      { fuelType: 'Diesel 500ppm', currentPrice: 23.25, newPrice: '' },
    ],
  },
  {
    stationId: 'STN-002',
    stationName: 'Caltex Rosebank',
    prices: [
      { fuelType: 'Petrol 95', currentPrice: 24.89, newPrice: '' },
      { fuelType: 'Petrol 93', currentPrice: 24.67, newPrice: '' },
      { fuelType: 'Diesel 50ppm', currentPrice: 23.45, newPrice: '' },
    ],
  },
  {
    stationId: 'STN-003',
    stationName: 'Engen Melrose',
    prices: [
      { fuelType: 'Petrol 95', currentPrice: 24.85, newPrice: '' },
      { fuelType: 'Diesel 50ppm', currentPrice: 23.40, newPrice: '' },
    ],
  },
];

export default function SetFuelPricesPage() {
  const [stationPrices, setStationPrices] = useState<StationPrices[]>(MOCK_STATION_PRICES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedStation, setSelectedStation] = useState('ALL');

  // Bulk price inputs
  const [bulkPrices, setBulkPrices] = useState({
    petrol95: '',
    petrol93: '',
    diesel50: '',
    diesel500: '',
  });

  const handlePriceChange = (stationId: string, fuelType: string, value: string) => {
    setStationPrices(prev =>
      prev.map(station => {
        if (station.stationId !== stationId) return station;
        return {
          ...station,
          prices: station.prices.map(price =>
            price.fuelType === fuelType ? { ...price, newPrice: value } : price
          ),
        };
      })
    );
  };

  const handleApplyBulk = () => {
    setStationPrices(prev =>
      prev.map(station => ({
        ...station,
        prices: station.prices.map(price => {
          let newPrice = '';
          if (price.fuelType === 'Petrol 95') newPrice = bulkPrices.petrol95;
          if (price.fuelType === 'Petrol 93') newPrice = bulkPrices.petrol93;
          if (price.fuelType === 'Diesel 50ppm') newPrice = bulkPrices.diesel50;
          if (price.fuelType === 'Diesel 500ppm') newPrice = bulkPrices.diesel500;
          return { ...price, newPrice: newPrice || price.newPrice };
        }),
      }))
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSuccessMessage('');

    // Update current prices with new prices
    setStationPrices(prev =>
      prev.map(station => ({
        ...station,
        prices: station.prices.map(price => ({
          ...price,
          currentPrice: price.newPrice ? parseFloat(price.newPrice) : price.currentPrice,
          newPrice: '',
        })),
      }))
    );

    setBulkPrices({ petrol95: '', petrol93: '', diesel50: '', diesel500: '' });
    setSuccessMessage('Prices updated successfully!');
    setIsSubmitting(false);

    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const hasChanges = stationPrices.some(s => s.prices.some(p => p.newPrice !== ''));

  // Filter stations based on selection
  const filteredStations = selectedStation === 'ALL'
    ? stationPrices
    : stationPrices.filter(s => s.stationId === selectedStation);

  return (
    <div className="page">
      <DevBanner />
      <PageHeader title="Set Fuel Prices" subtitle="Update fuel prices for all stations" />

      {/* Station Filter */}
      <div className="tab-filters">
        {STATIONS.map(s => (
          <button
            key={s.id}
            className={`tab-btn ${selectedStation === s.id ? 'active' : ''}`}
            onClick={() => setSelectedStation(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {successMessage && (
        <div className="success-banner" style={{ marginBottom: '20px' }}>
          <Check size={18} />
          {successMessage}
        </div>
      )}

      {/* Bulk Price Update */}
      <div className="section-card fade-in-up">
        <h3>
          <DollarSign size={18} />
          Bulk Price Update
        </h3>
        <p className="text-muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
          Set prices for all stations at once. Leave blank to skip.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bulk-petrol95">Petrol 95 (R/L)</label>
            <input
              id="bulk-petrol95"
              type="number"
              step="0.01"
              placeholder="e.g. 25.50"
              value={bulkPrices.petrol95}
              onChange={e => setBulkPrices({ ...bulkPrices, petrol95: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bulk-petrol93">Petrol 93 (R/L)</label>
            <input
              id="bulk-petrol93"
              type="number"
              step="0.01"
              placeholder="e.g. 25.28"
              value={bulkPrices.petrol93}
              onChange={e => setBulkPrices({ ...bulkPrices, petrol93: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bulk-diesel50">Diesel 50ppm (R/L)</label>
            <input
              id="bulk-diesel50"
              type="number"
              step="0.01"
              placeholder="e.g. 24.00"
              value={bulkPrices.diesel50}
              onChange={e => setBulkPrices({ ...bulkPrices, diesel50: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bulk-diesel500">Diesel 500ppm (R/L)</label>
            <input
              id="bulk-diesel500"
              type="number"
              step="0.01"
              placeholder="e.g. 23.80"
              value={bulkPrices.diesel500}
              onChange={e => setBulkPrices({ ...bulkPrices, diesel500: e.target.value })}
            />
          </div>
        </div>

        <button className="btn btn-outline" onClick={handleApplyBulk}>
          Apply to All Stations
        </button>
      </div>

      {/* Per-Station Prices */}
      <div className="section-card fade-in-up">
        <h3>
          <MapPin size={18} />
          Station-Specific Prices
          {selectedStation !== 'ALL' && (
            <span className="text-muted" style={{ fontWeight: 'normal', fontSize: '13px', marginLeft: '8px' }}>
              (Showing: {STATIONS.find(s => s.id === selectedStation)?.name})
            </span>
          )}
        </h3>

        {filteredStations.length === 0 ? (
          <p className="text-muted" style={{ padding: '20px', textAlign: 'center' }}>No stations found</p>
        ) : (
          filteredStations.map(station => (
          <div key={station.stationId} className="station-price-card">
            <div className="station-price-header">
              <span className="station-name">{station.stationName}</span>
              <span className="station-id">{station.stationId}</span>
            </div>

            <div className="station-price-grid">
              {station.prices.map(price => {
                const hasChange = price.newPrice !== '';
                const isIncrease = hasChange && parseFloat(price.newPrice) > price.currentPrice;
                const isDecrease = hasChange && parseFloat(price.newPrice) < price.currentPrice;

                return (
                  <div key={price.fuelType} className="price-input-group">
                    <label>
                      <span className={`fuel-badge fuel-${price.fuelType.toLowerCase().includes('petrol') ? 'petrol' : 'diesel'}`}>
                        {price.fuelType}
                      </span>
                    </label>
                    <div className="price-input-row">
                      <span className="current-price">R {price.currentPrice.toFixed(2)}</span>
                      <span className="price-arrow">→</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="New price"
                        value={price.newPrice}
                        onChange={e => handlePriceChange(station.stationId, price.fuelType, e.target.value)}
                        className={hasChange ? (isIncrease ? 'price-increase' : isDecrease ? 'price-decrease' : '') : ''}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
        )}
      </div>

      {/* Submit */}
      <div className="form-actions">
        <div className="form-warning" style={{ display: hasChanges ? 'flex' : 'none' }}>
          <AlertCircle size={16} />
          <span>You have unsaved price changes</span>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={!hasChanges || isSubmitting}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSubmitting ? 'Updating Prices...' : 'Update All Prices'}
        </button>
      </div>
    </div>
  );
}
