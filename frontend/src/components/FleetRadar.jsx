import React, { useState, useEffect } from 'react';
import { Truck, Thermometer, AlertTriangle, RefreshCw, Clock, MapPin } from 'lucide-react';
import { fetchFleetTelemetry } from '../api/client';

export default function FleetRadar() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchFleetTelemetry(100);
      if (res.success) setFleet(res.data);
    } catch (err) {
      console.error('Failed to load fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalVehicles = fleet.length;
  const criticalBreaches = fleet.filter(f => parseFloat(f.Current_Temperature_C) > 4.0).length;
  const severeCongestion = fleet.filter(f => parseFloat(f.Port_Congestion_Level) > 7.0).length;
  const highRiskVehicles = fleet.filter(f => (f.Risk_Classification || '').toLowerCase().includes('high')).length;

  const filteredFleet = fleet.filter(item => {
    const temp = parseFloat(item.Current_Temperature_C);
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'BREACH'
        ? temp > 4.0
        : (item.Risk_Classification || '').toLowerCase().includes('high');

    const searchStr = `${item.Latitude} ${item.Longitude} ${item.Cargo_Condition_Code} ${item.Risk_Classification}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#1c1917', margin: 0, fontWeight: 700 }}>
            Fleet Telemetry Radar
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '3px 0 0 0' }}>
            Real-time IoT telemetry streamed from SQL View <code>FDE_VIEWS.VW_ACTIVE_FLEET</code>
          </p>
        </div>

        <button onClick={loadData} disabled={loading} className="btn-primary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh Live Data
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="bi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#78716c', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>ACTIVE UNITS</span>
            <Truck size={17} color="#1e293b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1c1917', marginTop: '6px' }}>
            {totalVehicles}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '4px' }}>
            Monitored in Southern California
          </div>
        </div>

        <div className="bi-card" style={{ borderLeft: '4px solid #991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>TEMP BREACHES (&gt;4.0°C)</span>
            <Thermometer size={17} color="#991b1b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#991b1b', marginTop: '6px' }}>
            {criticalBreaches}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '4px' }}>
            {criticalBreaches > 0 ? 'Immediate SOP action required' : 'All fleets compliant'}
          </div>
        </div>

        <div className="bi-card" style={{ borderLeft: '4px solid #9a3412' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9a3412', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>PORT CONGESTION &gt;7.0</span>
            <AlertTriangle size={17} color="#9a3412" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#9a3412', marginTop: '6px' }}>
            {severeCongestion}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '4px' }}>
            San Bernardino cross-dock diversion
          </div>
        </div>

        <div className="bi-card" style={{ borderLeft: '4px solid #0f766e' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f766e', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>HIGH RISK VEHICLES</span>
            <Clock size={17} color="#0f766e" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f766e', marginTop: '6px' }}>
            {highRiskVehicles}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '4px' }}>
            Tier 2 Manager review list
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilter('ALL')}
            className={filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.785rem', padding: '6px 12px' }}
          >
            All Shipments ({totalVehicles})
          </button>
          <button
            onClick={() => setFilter('BREACH')}
            className={filter === 'BREACH' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.785rem', padding: '6px 12px', background: filter === 'BREACH' ? '#991b1b' : '' }}
          >
            Critical Spoilage ({criticalBreaches})
          </button>
          <button
            onClick={() => setFilter('HIGH_RISK')}
            className={filter === 'HIGH_RISK' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.785rem', padding: '6px 12px' }}
          >
            High Risk ({highRiskVehicles})
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter coordinates, cargo code..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: '7px 12px',
            border: '1px solid #ded9cd',
            borderRadius: '6px',
            background: '#ffffff',
            fontSize: '0.825rem',
            width: '280px',
            outline: 'none'
          }}
        />
      </div>

      {/* Telemetry Table */}
      <div className="bi-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="bi-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>GPS Coordinates</th>
              <th>Current Cargo Temp</th>
              <th>Cargo Code</th>
              <th>Risk Classification</th>
              <th>Delay Probability</th>
              <th>Port Congestion</th>
              <th>SOP Compliance</th>
            </tr>
          </thead>
          <tbody>
            {filteredFleet.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#78716c' }}>
                  {loading ? 'Streaming records from SQL server...' : 'No telemetry records matching filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredFleet.map((row, idx) => {
                const temp = parseFloat(row.Current_Temperature_C);
                const isBreach = temp > 4.0;
                const isSafe = temp >= 0.0 && temp <= 4.0;
                const delayProb = parseFloat(row.Delay_Probability || 0);

                return (
                  <tr key={idx}>
                    <td style={{ color: '#57534e', fontFamily: 'var(--font-mono)', fontSize: '0.785rem' }}>
                      {row.Timestamp ? new Date(row.Timestamp).toLocaleDateString() + ' ' + new Date(row.Timestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        <MapPin size={13} color="#78716c" />
                        {Number(row.Latitude).toFixed(3)}, {Number(row.Longitude).toFixed(3)}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={{
                          color: isBreach ? '#991b1b' : isSafe ? '#166534' : '#0369a1',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {Number(temp).toFixed(1)}°C
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
                      {(delayProb * 100).toFixed(0)}%
                    </td>
                    <td style={{ fontWeight: 600, color: Number(row.Port_Congestion_Level) > 7.0 ? '#c2410c' : '#57534e' }}>
                      {Number(row.Port_Congestion_Level || 0).toFixed(1)} / 10
                    </td>
                    <td>
                      {isBreach ? (
                        <span className="badge badge-danger">Critical Spoilage</span>
                      ) : isSafe ? (
                        <span className="badge badge-safe">In Compliance</span>
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
  );
}
