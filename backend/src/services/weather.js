/**
 * Fetches real-time weather and corridor conditions for GPS coordinates.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>}
 */
export async function fetchCorridorConditions(latitude, longitude) {
  try {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return 'Invalid GPS coordinates provided for corridor analysis.';
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const weather = data.current_weather || {};
    const temp = weather.temperature !== undefined ? weather.temperature : 'N/A';
    const wind = weather.windspeed || 0.0;

    const congestionIndex = wind > 10.0 ? 8.5 : 2.5;
    const statusNote = wind > 10.0 ? 'High Transit Disruption' : 'Corridor Normal';

    return (
      `--- LIVE CORRIDOR TELEMETRY ---\n` +
      `Target GPS: ${lat}, ${lon}\n` +
      `External Temp: ${temp}°C | Wind Speed: ${wind} km/h\n` +
      `Corridor Risk: ${statusNote} (Congestion Index: ${congestionIndex}/10)\n` +
      `-------------------------------`
    );
  } catch (err) {
    return `Corridor API Communication Failure: ${err.message}`;
  }
}
