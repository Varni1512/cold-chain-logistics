import { getAgentDb } from '../config/db.js';

/**
 * Executes a read-only SQL SELECT query against FDE_VIEWS.VW_ACTIVE_FLEET.
 * Strictly enforces that only SELECT operations are authorized.
 * @param {string} sqlQuery
 * @returns {Promise<string>}
 */
export async function queryTelemetryDb(sqlQuery) {
  const cleanQuery = (sqlQuery || '').trim();

  // Strict read-only enforcement
  if (!cleanQuery.toUpperCase().startsWith('SELECT')) {
    return 'SECURITY BLOCK: Only SELECT operations are authorized on this view.';
  }

  // Prevent batch execution attacks
  if (cleanQuery.includes(';') && cleanQuery.indexOf(';') < cleanQuery.length - 1) {
    return 'SECURITY BLOCK: Multi-statement SQL batches are disallowed.';
  }

  try {
    const pool = await getAgentDb();
    const result = await pool.request().query(cleanQuery);
    const rows = result.recordset || [];

    if (rows.length === 0) {
      return 'No records matched the query criteria.';
    }

    // Limit to top 10 rows for agent context safety
    const limitedRows = rows.slice(0, 10);
    const columns = Object.keys(limitedRows[0] || {});

    let formattedOutput = `COLUMNS: ${columns.join(', ')}\n`;
    for (const row of limitedRows) {
      formattedOutput += `(${columns.map(c => row[c]).join(', ')})\n`;
    }

    return formattedOutput;
  } catch (err) {
    return `Database Error: ${err.message}`;
  }
}

/**
 * Computes high-speed aggregate KPI statistics and chart distributions across ALL 32,065+ rows in FDE_VIEWS.VW_ACTIVE_FLEET.
 */
export async function fetchFleetStats() {
  try {
    const pool = await getAgentDb();
    
    // 1. Overall Totals
    const queryTotals = `
      SELECT 
        COUNT(*) AS total_records,
        SUM(CASE WHEN Current_Temperature_C > 4.0 THEN 1 ELSE 0 END) AS total_breaches,
        SUM(CASE WHEN Current_Temperature_C < 0.0 THEN 1 ELSE 0 END) AS total_freeze,
        SUM(CASE WHEN Current_Temperature_C >= 0.0 AND Current_Temperature_C <= 4.0 THEN 1 ELSE 0 END) AS total_safe,
        SUM(CASE WHEN Delay_Probability > 0.65 THEN 1 ELSE 0 END) AS total_high_delay,
        SUM(CASE WHEN Port_Congestion_Level > 7.0 THEN 1 ELSE 0 END) AS total_severe_port,
        AVG(Current_Temperature_C) AS avg_temp,
        AVG(Delay_Probability) AS avg_delay
      FROM FDE_VIEWS.VW_ACTIVE_FLEET
    `;
    const resTotals = await pool.request().query(queryTotals);
    const raw = resTotals.recordset[0] || {};

    const total = raw.total_records || 0;
    const breaches = raw.total_breaches || 0;
    const breachRate = total > 0 ? ((breaches / total) * 100).toFixed(1) : '0';
    const complianceScore = (100 - parseFloat(breachRate)).toFixed(1);

    // 2. Temperature Distribution Bins for Charts
    const queryTempBins = `
      SELECT 
        SUM(CASE WHEN Current_Temperature_C < -5 THEN 1 ELSE 0 END) AS deep_freeze,
        SUM(CASE WHEN Current_Temperature_C >= -5 AND Current_Temperature_C < 0 THEN 1 ELSE 0 END) AS sub_zero,
        SUM(CASE WHEN Current_Temperature_C >= 0 AND Current_Temperature_C <= 4 THEN 1 ELSE 0 END) AS sop_optimal,
        SUM(CASE WHEN Current_Temperature_C > 4 AND Current_Temperature_C <= 8 THEN 1 ELSE 0 END) AS mild_breach,
        SUM(CASE WHEN Current_Temperature_C > 8 THEN 1 ELSE 0 END) AS severe_breach
      FROM FDE_VIEWS.VW_ACTIVE_FLEET
    `;
    const resTempBins = await pool.request().query(queryTempBins);
    const tb = resTempBins.recordset[0] || {};

    const temperatureDistribution = [
      { name: 'Deep Freeze (<-5°C)', count: tb.deep_freeze || 0, fill: '#0284c7' },
      { name: 'Sub-Zero (-5 to 0°C)', count: tb.sub_zero || 0, fill: '#38bdf8' },
      { name: 'SOP Target (0 to 4°C)', count: tb.sop_optimal || 0, fill: '#166534' },
      { name: 'Mild Breach (4 to 8°C)', count: tb.mild_breach || 0, fill: '#ca8a04' },
      { name: 'Severe Spoilage (>8°C)', count: tb.severe_breach || 0, fill: '#991b1b' }
    ];

    // 3. Risk Classification Bins for Pie/Donut Chart
    const queryRiskBins = `
      SELECT Risk_Classification AS name, COUNT(*) AS value
      FROM FDE_VIEWS.VW_ACTIVE_FLEET
      GROUP BY Risk_Classification
    `;
    const resRiskBins = await pool.request().query(queryRiskBins);
    const riskDistribution = (resRiskBins.recordset || []).map(r => ({
      name: r.name || 'Unclassified',
      value: r.value || 0
    }));

    // 4. Port Congestion Corridors
    const queryCongestionBins = `
      SELECT 
        CASE 
          WHEN Port_Congestion_Level < 3 THEN 'Low (0-3 Index)'
          WHEN Port_Congestion_Level >= 3 AND Port_Congestion_Level <= 7 THEN 'Moderate (3-7 Index)'
          ELSE 'Severe (>7 Index)'
        END AS name,
        COUNT(*) AS volume,
        ROUND(AVG(Delay_Probability) * 100, 1) AS avgDelayPercent
      FROM FDE_VIEWS.VW_ACTIVE_FLEET
      GROUP BY 
        CASE 
          WHEN Port_Congestion_Level < 3 THEN 'Low (0-3 Index)'
          WHEN Port_Congestion_Level >= 3 AND Port_Congestion_Level <= 7 THEN 'Moderate (3-7 Index)'
          ELSE 'Severe (>7 Index)'
        END
    `;
    const resCongestion = await pool.request().query(queryCongestionBins);
    const congestionDistribution = resCongestion.recordset || [];

    return {
      totalRecords: total,
      totalBreaches: breaches,
      totalFreeze: raw.total_freeze || 0,
      totalSafe: raw.total_safe || 0,
      totalHighDelay: raw.total_high_delay || 0,
      totalSeverePort: raw.total_severe_port || 0,
      avgTemp: raw.avg_temp ? raw.avg_temp.toFixed(1) : '0',
      avgDelay: raw.avg_delay ? (raw.avg_delay * 100).toFixed(1) : '0',
      breachRate,
      complianceScore,
      temperatureDistribution,
      riskDistribution,
      congestionDistribution
    };
  } catch (err) {
    console.error('Failed to compute fleet statistics:', err.message);
    return {
      totalRecords: 0,
      totalBreaches: 0,
      totalFreeze: 0,
      totalSafe: 0,
      totalHighDelay: 0,
      totalSeverePort: 0,
      avgTemp: '0',
      avgDelay: '0',
      breachRate: '0',
      complianceScore: '100',
      temperatureDistribution: [],
      riskDistribution: [],
      congestionDistribution: []
    };
  }
}

/**
 * Fetches active fleet telemetry rows for data exploration & export.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function fetchRecentFleet(limit = 200) {
  try {
    const pool = await getAgentDb();
    const query = `
      SELECT TOP ${parseInt(limit, 10)}
        Timestamp, Latitude, Longitude, Current_Temperature_C,
        Cargo_Condition_Code, Risk_Classification, Delay_Probability,
        Port_Congestion_Level, Route_Risk_Index
      FROM FDE_VIEWS.VW_ACTIVE_FLEET
      ORDER BY Timestamp DESC
    `;
    const result = await pool.request().query(query);
    return result.recordset || [];
  } catch (err) {
    console.error('Failed to fetch recent fleet:', err.message);
    return [];
  }
}
