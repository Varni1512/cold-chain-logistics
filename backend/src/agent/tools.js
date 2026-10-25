import { queryTelemetryDb } from '../services/telemetry.js';
import { fetchCorridorConditions } from '../services/weather.js';
import { searchComplianceSop } from '../services/pinecone.js';

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'query_telemetry_db',
      description: 'Executes a read-only SQL SELECT query against FDE_VIEWS.VW_ACTIVE_FLEET. Columns available: Timestamp, Latitude, Longitude, Current_Temperature_C, Cargo_Condition_Code, Risk_Classification, Delay_Probability, Port_Congestion_Level, Route_Risk_Index. Note: Risk_Classification values are exactly "High Risk", "Moderate Risk", or "Low Risk". Always write standard T-SQL queries.',
      parameters: {
        type: 'object',
        properties: {
          sql_query: {
            type: 'string',
            description: 'The T-SQL SELECT query to execute, e.g. SELECT TOP 5 * FROM FDE_VIEWS.VW_ACTIVE_FLEET'
          }
        },
        required: ['sql_query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_corridor_conditions',
      description: 'Fetches real-time weather and corridor conditions from a live REST API for given GPS coordinates. Provides temperature, wind speed, and computed corridor congestion index.',
      parameters: {
        type: 'object',
        properties: {
          latitude: {
            type: 'number',
            description: 'Latitude coordinate of the transit corridor (e.g. 33.77)'
          },
          longitude: {
            type: 'number',
            description: 'Longitude coordinate of the transit corridor (e.g. -118.19)'
          }
        },
        required: ['latitude', 'longitude']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_compliance_sop',
      description: 'Searches enterprise Standard Operating Procedures (SOPs) indexed in the Pinecone Vector DB. Use this to retrieve regulatory thresholds, cold-chain breach mitigations, and rerouting rules.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language search query for compliance rules, e.g. "What are the temperature rules for fresh perishables?"'
          }
        },
        required: ['query']
      }
    }
  }
];

export async function executeToolCall(toolName, args) {
  switch (toolName) {
    case 'query_telemetry_db':
      return await queryTelemetryDb(args.sql_query);

    case 'fetch_corridor_conditions':
      return await fetchCorridorConditions(args.latitude, args.longitude);

    case 'search_compliance_sop':
      return await searchComplianceSop(args.query);

    default:
      return `Unknown tool function: ${toolName}`;
  }
}
