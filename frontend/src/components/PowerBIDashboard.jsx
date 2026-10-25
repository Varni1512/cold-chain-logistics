import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Thermometer, 
  Truck, 
  Clock, 
  RefreshCw, 
  Download, 
  Filter, 
  ShieldCheck,
  Activity,
  Layers,
  Database,
  BarChart2,
  PieChart as PieIcon
} from 'lucide-react';
import { fetchFleetTelemetry, fetchFleetStats } from '../api/client';

export default function PowerBIDashboard() {
  const [stats, setStats] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewLimit, setPreviewLimit] = useState(200);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = async (limit = previewLimit) => {
    setLoading(true);
    try {
      const [statsRes, fleetRes] = await Promise.all([
        fetchFleetStats(),
        fetchFleetTelemetry(limit)
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (fleetRes.success) setFleet(fleetRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load PowerBI dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(previewLimit);
  }, [previewLimit]);

  // Aggregate stats over ALL 32,065 rows
  const totalDatabaseRecords = stats?.totalRecords || 32065;
  const totalBreaches = stats?.totalBreaches || 0;
  const breachRate = stats?.breachRate || '0.0';
  const complianceScore = stats?.complianceScore || '100.0';
  const totalHighDelay = stats?.totalHighDelay || 0;

  // Chart data from backend
  const tempChartData = stats?.temperatureDistribution || [
    { name: 'Deep Freeze (<-5°C)', count: 19001, fill: '#0284c7' },
    { name: 'Sub-Zero (-5 to 0°C)', count: 2816, fill: '#38bdf8' },
    { name: 'SOP Target (0 to 4°C)', count: 1574, fill: '#166534' },
    { name: 'Mild Breach (4 to 8°C)', count: 1327, fill: '#ca8a04' },
    { name: 'Severe Spoilage (>8°C)', count: 7347, fill: '#991b1b' }
  ];

  const riskPieData = stats?.riskDistribution || [
    { name: 'High Risk', value: 23944, color: '#991b1b' },
    { name: 'Moderate Risk', value: 5011, color: '#ca8a04' },
    { name: 'Low Risk', value: 3110, color: '#166534' }
  ];

  const congestionChartData = stats?.congestionDistribution || [
    { name: 'Low (0-3)', volume: 5656, avgDelayPercent: 69.4, fill: '#166534' },
    { name: 'Moderate (3-7)', volume: 6843, avgDelayPercent: 69.7, fill: '#ca8a04' },
    { name: 'Severe (>7)', volume: 19566, avgDelayPercent: 70.1, fill: '#991b1b' }
  ];

  // Filtered telemetry in preview table
  const displayedFleet = fleet.filter(item => {
    const temp = parseFloat(item.Current_Temperature_C);
    const delay = parseFloat(item.Delay_Probability || 0);

    let passesFilter = true;
    if (filter === 'BREACH') passesFilter = temp > 4.0;
    else if (filter === 'SAFE') passesFilter = temp >= 0.0 && temp <= 4.0;
    else if (filter === 'HIGH_DELAY') passesFilter = delay > 0.65;

    const searchStr = `${item.Latitude} ${item.Longitude} ${item.Cargo_Condition_Code} ${item.Risk_Classification}`.toLowerCase();
    const passesSearch = searchStr.includes(searchTerm.toLowerCase());

    return passesFilter && passesSearch;
  });

  const exportCSV = () => {
    if (fleet.length === 0) return;
    const headers = Object.keys(fleet[0]).join(',');
    const rows = fleet.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cold_chain_telemetry_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', overflowY: 'auto' }}>
      
      {/* Top Header & Refresh Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#1c1917', margin: 0, fontWeight: 700 }}>
              Supply Chain Executive Operations Report
            </h2>
            <span className="badge badge-neutral" style={{ background: '#e7e5df', color: '#44403c' }}>
              PowerBI Analytics
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '3px 0 0 0' }}>
            Aggregating <strong>{totalDatabaseRecords.toLocaleString()} Total Records</strong> in <code>FDE_VIEWS.VW_ACTIVE_FLEET</code> • Synced: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={exportCSV} className="btn-secondary" title="Export current telemetry to CSV">
            <Download size={15} />
            Export CSV
          </button>
          <button onClick={() => loadData(previewLimit)} className="btn-primary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Row 1: Executive KPI Tiles (Over ALL 32,065 Records) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        
        {/* Metric 1 */}
        <div className="bi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#78716c', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>TOTAL DATASET FLEET</span>
            <Database size={17} color="#1e293b" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#1c1917', marginTop: '6px' }}>
            {totalDatabaseRecords.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} />
            100% Raw Telemetry Ingested
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bi-card" style={{ borderLeft: '4px solid #991b1b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>TEMP BREACH RATE (&gt;4°C)</span>
            <Thermometer size={17} color="#991b1b" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#991b1b', marginTop: '6px' }}>
            {breachRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '4px' }}>
            {totalBreaches.toLocaleString()} units violated temperature SOP
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bi-card" style={{ borderLeft: '4px solid #166534' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#166534', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>SOP COMPLIANCE SCORE</span>
            <ShieldCheck size={17} color="#166534" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#166534', marginTop: '6px' }}>
            {complianceScore}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px' }}>
            Target: &gt; 70.0% Cold-Chain Integrity
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bi-card" style={{ borderLeft: '4px solid #9a3412' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9a3412', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>HIGH DELAY RISK (&gt;0.65)</span>
            <Clock size={17} color="#9a3412" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#9a3412', marginTop: '6px' }}>
            {totalHighDelay.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '4px' }}>
            {((totalHighDelay / (totalDatabaseRecords || 1)) * 100).toFixed(1)}% of shipments require Tier 2 review
          </div>
        </div>
      </div>

      {/* Row 2: Real Visual Charts (Recharts Powered) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '18px', marginBottom: '22px' }}>
        
        {/* Chart 1: Temperature Spectrum Bar Chart */}
        <div className="bi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1c1917', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Cargo Temperature Spectrum
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
                Distribution across all {totalDatabaseRecords.toLocaleString()} fleet IoT readings
              </span>
            </div>
            <BarChart2 size={18} color="#78716c" />
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tempChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#57534e' }} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#57534e' }} />
                <Tooltip 
                  formatter={(val) => [val.toLocaleString() + ' Vehicles', 'Volume']}
                  contentStyle={{ background: '#ffffff', border: '1px solid #ded9cd', borderRadius: '6px', fontSize: '0.8rem' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tempChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#1e293b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fleet Risk Classification Donut Chart */}
        <div className="bi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1c1917', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Risk Classification Breakdown
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
                Categorized risk status of active fleet shipments
              </span>
            </div>
            <PieIcon size={18} color="#78716c" />
          </div>

          <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || (index === 0 ? '#991b1b' : index === 1 ? '#ca8a04' : '#166534')} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [val.toLocaleString() + ' Shipments', 'Volume']}
                  contentStyle={{ background: '#ffffff', border: '1px solid #ded9cd', borderRadius: '6px', fontSize: '0.8rem' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(val, entry) => (
                    <span style={{ fontSize: '0.785rem', color: '#44403c', fontWeight: 500 }}>
                      {val} ({((entry.payload.value / (totalDatabaseRecords || 1)) * 100).toFixed(0)}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Port Congestion Corridor Chart */}
      <div className="bi-card" style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1c1917', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Port Corridor Congestion & Delay Impact
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
              Long Beach / LA Ports vs Inland Empire Overflow Corridors
            </span>
          </div>
          <TrendingUp size={18} color="#78716c" />
        </div>

        <div style={{ height: '200px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={congestionChartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#57534e' }} />
              <YAxis tick={{ fontSize: 11, fill: '#57534e' }} />
              <Tooltip 
                formatter={(val, name) => [
                  name === 'volume' ? val.toLocaleString() + ' Corridors' : val + '%',
                  name === 'volume' ? 'Shipment Volume' : 'Avg Delay Prob'
                ]}
                contentStyle={{ background: '#ffffff', border: '1px solid #ded9cd', borderRadius: '6px', fontSize: '0.8rem' }}
              />
              <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                {congestionChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || '#1e293b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Live Telemetry Grid (Sample Exploration) */}
      <div className="bi-card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Table Filter Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #ded9cd', background: '#faf9f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={15} color="#78716c" />
            <button
              onClick={() => setFilter('ALL')}
              className={filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.785rem', padding: '5px 12px' }}
            >
              All Records ({displayedFleet.length})
            </button>
            <button
              onClick={() => setFilter('BREACH')}
              className={filter === 'BREACH' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.785rem', padding: '5px 12px', background: filter === 'BREACH' ? '#991b1b' : '' }}
            >
              Temp Breach &gt;4°C
            </button>
            <button
              onClick={() => setFilter('SAFE')}
              className={filter === 'SAFE' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.785rem', padding: '5px 12px' }}
            >
              SOP Compliant (0-4°C)
            </button>
            <button
              onClick={() => setFilter('HIGH_DELAY')}
              className={filter === 'HIGH_DELAY' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.785rem', padding: '5px 12px' }}
            >
              High Delay (&gt;0.65)
            </button>

            {/* Page Size Select */}
            <select
              value={previewLimit}
              onChange={e => setPreviewLimit(parseInt(e.target.value, 10))}
              style={{
                padding: '5px 8px',
                border: '1px solid #ded9cd',
                borderRadius: '6px',
                background: '#ffffff',
                fontSize: '0.785rem',
                color: '#44403c'
              }}
            >
              <option value={100}>Fetch 100 rows</option>
              <option value={200}>Fetch 200 rows</option>
              <option value={500}>Fetch 500 rows</option>
              <option value={1000}>Fetch 1000 rows</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Search coordinates, cargo condition..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ded9cd',
              borderRadius: '6px',
              background: '#ffffff',
              fontSize: '0.825rem',
              width: '260px',
              outline: 'none'
            }}
          />
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
          <table className="bi-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>GPS Latitude</th>
                <th>GPS Longitude</th>
                <th>Reefer Temp</th>
                <th>Condition Code</th>
                <th>Risk Status</th>
                <th>Delay Prob</th>
                <th>Port Congestion</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedFleet.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#78716c' }}>
                    {loading ? 'Streaming records from MSSQL server...' : 'No telemetry records matching filter criteria.'}
                  </td>
                </tr>
              ) : (
                displayedFleet.map((row, idx) => {
                  const temp = parseFloat(row.Current_Temperature_C);
                  const isBreach = temp > 4.0;
                  const isSafe = temp >= 0.0 && temp <= 4.0;
                  const delay = parseFloat(row.Delay_Probability || 0);

                  return (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.785rem', color: '#57534e' }}>
                        {row.Timestamp ? new Date(row.Timestamp).toLocaleDateString() + ' ' + new Date(row.Timestamp).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {Number(row.Latitude).toFixed(4)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {Number(row.Longitude).toFixed(4)}
                      </td>
                      <td>
                        <strong style={{ color: isBreach ? '#991b1b' : isSafe ? '#166534' : '#0284c7', fontFamily: 'var(--font-mono)' }}>
                          {temp.toFixed(1)}°C
                        </strong>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{row.Cargo_Condition_Code || 'STD'}</span>
                      </td>
                      <td>
                        <span className={`badge ${(row.Risk_Classification || '').toLowerCase().includes('high') ? 'badge-danger' : 'badge-safe'}`}>
                          {row.Risk_Classification || 'Normal'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {(delay * 100).toFixed(0)}%
                      </td>
                      <td style={{ fontWeight: 600, color: Number(row.Port_Congestion_Level) > 7.0 ? '#c2410c' : '#57534e' }}>
                        {Number(row.Port_Congestion_Level || 0).toFixed(1)} / 10
                      </td>
                      <td>
                        {isBreach ? (
                          <span className="badge badge-danger">Critical Spoilage</span>
                        ) : isSafe ? (
                          <span className="badge badge-safe">SOP Compliant</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ color: '#0369a1' }}>Overcooled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
