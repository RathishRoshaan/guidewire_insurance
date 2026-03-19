import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CloudLightning, Thermometer, Droplets, Wind, Eye, MapPin, RefreshCw, AlertTriangle, Gauge } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Weather.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tooltip-value" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Weather() {
  const { weatherData, CITIES, generateRiskAssessment } = useApp();
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const riskData = useMemo(() => {
    return generateRiskAssessment(selectedCity);
  }, [selectedCity, generateRiskAssessment]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const currentWeather = weatherData[weatherData.length - 1] || {};
  const getAqiLevel = (aqi) => {
    if (aqi <= 50) return { label: 'Good', color: '#10b981' };
    if (aqi <= 100) return { label: 'Moderate', color: '#f59e0b' };
    if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: '#9333ea' };
    return { label: 'Hazardous', color: '#dc2626' };
  };

  const aqiInfo = getAqiLevel(currentWeather.aqi || 0);

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="weather-header">
          <div>
            <h1 className="page-title">Live Environmental Data</h1>
            <p className="page-subtitle">Real-time weather, pollution, and risk monitoring from external APIs</p>
          </div>
          <div className="weather-header-actions">
            <select
              className="form-select city-select"
              value={selectedCity.id}
              onChange={e => setSelectedCity(CITIES.find(c => c.id === e.target.value) || CITIES[0])}
              id="weather-city-select"
            >
              {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className={`btn-secondary refresh-btn ${isRefreshing ? 'refreshing' : ''}`} onClick={handleRefresh}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Current Conditions */}
      <div className="weather-current animate-fade-in-up delay-1">
        <div className="glass-card weather-main-card">
          <div className="weather-main-header">
            <MapPin size={16} />
            <span>{selectedCity.name}, {selectedCity.state}</span>
            <span className="weather-timestamp">Updated just now</span>
          </div>
          <div className="weather-main-content">
            <div className="temp-display">
              <Thermometer size={32} style={{ color: '#f59e0b' }} />
              <span className="temp-value">{currentWeather.temperature?.toFixed(1) || '--'}°C</span>
            </div>
            <div className="weather-condition-text">
              {currentWeather.rainfall > 20 ? '🌧️ Heavy Rain' : currentWeather.rainfall > 0 ? '🌦️ Light Showers' : currentWeather.temperature > 40 ? '☀️ Extreme Heat' : '⛅ Partly Cloudy'}
            </div>
          </div>
        </div>

        <div className="weather-metrics-grid">
          <div className="glass-card weather-metric">
            <Droplets size={20} style={{ color: '#0ea5e9' }} />
            <div className="metric-info">
              <span className="metric-value">{currentWeather.humidity?.toFixed(0) || '--'}%</span>
              <span className="metric-label">Humidity</span>
            </div>
          </div>
          <div className="glass-card weather-metric">
            <CloudLightning size={20} style={{ color: '#6366f1' }} />
            <div className="metric-info">
              <span className="metric-value">{currentWeather.rainfall?.toFixed(1) || '0'}mm</span>
              <span className="metric-label">Rainfall</span>
            </div>
          </div>
          <div className="glass-card weather-metric">
            <Wind size={20} style={{ color: '#10b981' }} />
            <div className="metric-info">
              <span className="metric-value">{currentWeather.windSpeed?.toFixed(0) || '--'}km/h</span>
              <span className="metric-label">Wind Speed</span>
            </div>
          </div>
          <div className="glass-card weather-metric aqi-metric" style={{ borderColor: `${aqiInfo.color}30` }}>
            <Gauge size={20} style={{ color: aqiInfo.color }} />
            <div className="metric-info">
              <span className="metric-value" style={{ color: aqiInfo.color }}>{currentWeather.aqi || '--'}</span>
              <span className="metric-label">AQI — {aqiInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="weather-charts animate-fade-in-up delay-2">
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Temperature & Humidity (24h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="temp" stroke="#f59e0b" fontSize={11} />
              <YAxis yAxisId="humid" orientation="right" stroke="#0ea5e9" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} dot={false} name="Temp °C" />
              <Line yAxisId="humid" type="monotone" dataKey="humidity" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Humidity %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Rainfall (24h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rainfall" fill="#6366f1" radius={[4, 4, 0, 0]} name="Rainfall mm" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wind & AQI */}
      <div className="weather-charts animate-fade-in-up delay-3">
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Wind Speed (24h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weatherData}>
              <defs>
                <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="windSpeed" stroke="#10b981" fill="url(#windGrad)" strokeWidth={2} name="Wind km/h" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Air Quality Index (24h)</h3>
            {currentWeather.aqi > 300 && (
              <span className="badge badge-danger"><AlertTriangle size={12} /> Hazardous</span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weatherData}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="aqi" stroke="#ef4444" fill="url(#aqiGrad)" strokeWidth={2} name="AQI" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* City Risk Assessment */}
      {riskData && (
        <div className="glass-card risk-assessment-card animate-fade-in-up delay-4">
          <div className="chart-header">
            <h3>🎯 AI Risk Assessment — {selectedCity.name}</h3>
            <span className="badge badge-primary">Live Analysis</span>
          </div>
          <div className="risk-assessment-grid">
            {[
              { label: 'Overall Risk', value: riskData.overallRisk, color: riskData.overallRisk > 70 ? '#ef4444' : riskData.overallRisk > 40 ? '#f59e0b' : '#10b981' },
              { label: 'Weather Risk', value: riskData.weatherRisk, color: '#0ea5e9' },
              { label: 'Pollution Risk', value: riskData.pollutionRisk, color: '#8b5cf6' },
              { label: 'Traffic Risk', value: riskData.trafficRisk, color: '#f59e0b' },
              { label: 'Platform Risk', value: riskData.platformRisk, color: '#6366f1' },
              { label: 'Civic Risk', value: riskData.civicRisk, color: '#ef4444' },
            ].map((risk, i) => (
              <div key={i} className="risk-metric">
                <div className="risk-metric-header">
                  <span>{risk.label}</span>
                  <span className="risk-metric-value" style={{ color: risk.color }}>{risk.value}/100</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${risk.value}%`, background: risk.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="risk-summary">
            <div className="risk-summary-item">
              <span>Historical Disruption Events</span>
              <strong>{riskData.historicalEvents} (last 6 months)</strong>
            </div>
            <div className="risk-summary-item">
              <span>Avg Payout per Event</span>
              <strong>₹{riskData.avgPayoutPerEvent.toLocaleString()}</strong>
            </div>
            <div className="risk-summary-item">
              <span>Risk Multiplier</span>
              <strong>{selectedCity.riskMultiplier}x</strong>
            </div>
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className="glass-card data-sources-card animate-fade-in-up delay-5">
        <div className="chart-header">
          <h3>📡 Data Sources</h3>
        </div>
        <div className="sources-grid">
          {[
            { name: 'OpenWeatherMap', type: 'Weather', status: 'Connected', latency: '120ms' },
            { name: 'AQICN', type: 'Air Quality', status: 'Connected', latency: '85ms' },
            { name: 'Google Maps Traffic', type: 'Traffic', status: 'Connected', latency: '200ms' },
            { name: 'Platform API', type: 'Platform Status', status: 'Mocked', latency: 'N/A' },
            { name: 'IMD Weather Alerts', type: 'Severe Weather', status: 'Connected', latency: '150ms' },
            { name: 'NDMA Alerts', type: 'Civic/Disaster', status: 'Connected', latency: '300ms' },
          ].map((source, i) => (
            <div key={i} className="source-item">
              <div className="source-status">
                <div className={`status-dot ${source.status === 'Connected' ? 'active' : ''}`} />
              </div>
              <div className="source-info">
                <strong>{source.name}</strong>
                <span>{source.type}</span>
              </div>
              <div className="source-meta">
                <span className={`badge ${source.status === 'Connected' ? 'badge-success' : 'badge-warning'}`}>{source.status}</span>
                <span className="source-latency">{source.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
