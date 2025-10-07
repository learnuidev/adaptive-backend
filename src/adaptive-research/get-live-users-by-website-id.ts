import { formatDateForClickHouse } from "./utils.js";

/**
 * Build WHERE conditions from filter array
 * @param filters - Array of filter objects with key, operator, and value
 * @returns string - SQL WHERE conditions
 */
function buildFilterConditions(filters: any[]): string {
  if (!filters || filters.length === 0) {
    return "";
  }

  const conditions: string[] = [];

  for (const filter of filters) {
    const { key, operator, value } = filter;

    // Handle metadata filters (key starts with 'metadata.')
    if (key.startsWith("metadata.")) {
      const metadataKey = key.substring(9); // Remove 'metadata.' prefix
      conditions.push(buildMetadataCondition(metadataKey, operator, value));
    } else {
      conditions.push(buildStandardCondition(key, operator, value));
    }
  }

  return conditions.join(" AND ");
}

/**
 * Build condition for standard event attributes
 */
function buildStandardCondition(
  key: string,
  operator: string,
  value: any
): string {
  const column = escapeColumnName(key);

  switch (operator) {
    case "eq":
      return `${column} = ${escapeValue(value)}`;
    case "ne":
      return `${column} != ${escapeValue(value)}`;
    case "contains":
      return `like(${column}, ${escapeValue(`%${value}%`)})`;
    case "startsWith":
      return `like(${column}, ${escapeValue(`${value}%`)})`;
    case "endsWith":
      return `like(${column}, ${escapeValue(`%${value}`)})`;
    case "gt":
      return `${column} > ${escapeValue(value)}`;
    case "gte":
      return `${column} >= ${escapeValue(value)}`;
    case "lt":
      return `${column} < ${escapeValue(value)}`;
    case "lte":
      return `${column} <= ${escapeValue(value)}`;
    case "in":
      return `${column} IN (${escapeArrayValue(value)})`;
    case "nin":
      return `${column} NOT IN (${escapeArrayValue(value)})`;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

/**
 * Build condition for metadata attributes
 */
function buildMetadataCondition(
  key: string,
  operator: string,
  value: any
): string {
  switch (operator) {
    case "eq":
      return `mapContains(metadata, ${escapeValue(key)}) AND metadata[${escapeValue(key)}] = ${escapeValue(value)}`;
    case "ne":
      return `NOT mapContains(metadata, ${escapeValue(key)}) OR metadata[${escapeValue(key)}] != ${escapeValue(value)}`;
    case "contains":
      return `mapContains(metadata, ${escapeValue(key)}) AND like(metadata[${escapeValue(key)}], ${escapeValue(`%${value}%`)})`;
    case "startsWith":
      return `mapContains(metadata, ${escapeValue(key)}) AND like(metadata[${escapeValue(key)}], ${escapeValue(`${value}%`)})`;
    case "endsWith":
      return `mapContains(metadata, ${escapeValue(key)}) AND like(metadata[${escapeValue(key)}], ${escapeValue(`%${value}`)})`;
    case "gt":
      return `mapContains(metadata, ${escapeValue(key)}) AND toFloat64OrNull(metadata[${escapeValue(key)}]) > ${escapeValue(value)}`;
    case "gte":
      return `mapContains(metadata, ${escapeValue(key)}) AND toFloat64OrNull(metadata[${escapeValue(key)}]) >= ${escapeValue(value)}`;
    case "lt":
      return `mapContains(metadata, ${escapeValue(key)}) AND toFloat64OrNull(metadata[${escapeValue(key)}]) < ${escapeValue(value)}`;
    case "lte":
      return `mapContains(metadata, ${escapeValue(key)}) AND toFloat64OrNull(metadata[${escapeValue(key)}]) <= ${escapeValue(value)}`;
    case "in":
      return `mapContains(metadata, ${escapeValue(key)}) AND metadata[${escapeValue(key)}] IN (${escapeArrayValue(value)})`;
    case "nin":
      return `NOT mapContains(metadata, ${escapeValue(key)}) OR metadata[${escapeValue(key)}] NOT IN (${escapeArrayValue(value)})`;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

/**
 * Escape column names to prevent SQL injection
 */
function escapeColumnName(column: string): string {
  // Basic validation - only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
    throw new Error(`Invalid column name: ${column}`);
  }
  return column;
}

/**
 * Escape values for SQL
 */
function escapeValue(value: any): string {
  if (typeof value === "string") {
    // Escape single quotes and wrap in quotes
    return `'${value.replace(/'/g, "\\'")}'`;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  throw new Error(`Unsupported value type: ${typeof value}`);
}

/**
 * Escape array values for SQL IN clauses
 */
function escapeArrayValue(value: any[]): string {
  if (!Array.isArray(value)) {
    throw new Error("Value must be an array for IN/NIN operations");
  }
  return value.map((v) => escapeValue(v)).join(", ");
}

/**
 * Get live users for a website based on recent activity
 * Live users are defined as users who have had any event within the specified time window
 * @param clickHouseClient - ClickHouse client instance
 * @param websiteId - Website identifier
 * @param timeWindowMinutes - Time window in minutes to consider a user "live" (default: 30)
 * @param filters - Array of filters to apply to event attributes (optional)
 * @returns Promise<LiveUser[]> - Array of live users with their latest activity
 */
export const getLiveUsersByWebsiteId = async (
  clickHouseClient: any,
  websiteId: string,
  timeWindowMinutes: number = 30,
  filters: any[] = []
) => {
  // Calculate the timestamp threshold
  const now = new Date();
  const thresholdTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
  const thresholdString = formatDateForClickHouse(thresholdTime);

  // Build WHERE conditions from filters
  const filterConditions = buildFilterConditions(filters);

  const query = `
    SELECT 
      visitor_id,
      session_id,
      identity_id,
      email,
      max(created_at) as last_activity,
      min(created_at) as session_start,
      count(*) as event_count,
      any(href) as last_page,
      any(event_name) as last_event_name,
      any(country) as country,
      any(region) as region,
      any(city) as city,
      any(latitude) as latitude,
      any(longitude) as longitude,
      any(browser_name) as browser_name,
      any(os_name) as os_name,
      any(device_model) as device_model,
      groupArray(DISTINCT event_name) as event_types,
      groupArray(DISTINCT href) as pages_visited
    FROM (
      SELECT *
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${thresholdString}'
        ${filterConditions ? `AND ${filterConditions}` : ""}
    )
    GROUP BY visitor_id, session_id, identity_id, email
    ORDER BY last_activity DESC
  `;

  const resp = await clickHouseClient.query({
    query,
    format: "JSONEachRow",
  });

  const users = await resp.json();

  // Add derived fields
  return users.map((user: any) => ({
    ...user,
    session_duration_minutes: Math.floor(
      (new Date(user.last_activity).getTime() -
        new Date(user.session_start).getTime()) /
        (1000 * 60)
    ),
    is_active: true, // All returned users are active by definition
    time_since_last_activity_minutes: Math.floor(
      (now.getTime() - new Date(user.last_activity).getTime()) / (1000 * 60)
    ),
  }));
};

/**
 * Get live user count summary for a website
 * @param clickHouseClient - ClickHouse client instance
 * @param websiteId - Website identifier
 * @param timeWindowMinutes - Time window in minutes to consider a user "live" (default: 30)
 * @param filters - Array of filters to apply to event attributes (optional)
 * @returns Promise<LiveUserSummary> - Summary of live user statistics
 */
export const getLiveUserSummaryByWebsiteId = async (
  clickHouseClient: any,
  websiteId: string,
  timeWindowMinutes: number = 30,
  filters: any[] = []
) => {
  // Calculate the timestamp threshold
  const now = new Date();
  const thresholdTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
  const thresholdString = formatDateForClickHouse(thresholdTime);

  // Build WHERE conditions from filters
  const filterConditions = buildFilterConditions(filters);

  const query = `
    SELECT 
      count(DISTINCT visitor_id) as total_live_visitors,
      count(DISTINCT session_id) as total_active_sessions,
      count(*) as total_events,
      count(DISTINCT identity_id) as total_identified_users,
      count(DISTINCT country) as total_countries,
      count(DISTINCT city) as total_cities,
      avg(event_count) as avg_events_per_session,
      max(event_count) as max_events_in_session
    FROM (
      SELECT 
        visitor_id,
        session_id,
        identity_id,
        country,
        city,
        count(*) as event_count
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${thresholdString}'
        ${filterConditions ? `AND ${filterConditions}` : ""}
      GROUP BY visitor_id, session_id, identity_id, country, city
    )
  `;

  const resp = await clickHouseClient.query({
    query,
    format: "JSONEachRow",
  });

  const result = await resp.json();
  return (
    result[0] || {
      total_live_visitors: 0,
      total_active_sessions: 0,
      total_events: 0,
      total_identified_users: 0,
      total_countries: 0,
      total_cities: 0,
      avg_events_per_session: 0,
      max_events_in_session: 0,
    }
  );
};

/**
 * Get live users breakdown by geographic location
 * @param clickHouseClient - ClickHouse client instance
 * @param websiteId - Website identifier
 * @param timeWindowMinutes - Time window in minutes to consider a user "live" (default: 30)
 * @param filters - Array of filters to apply to event attributes (optional)
 * @returns Promise<GeographicBreakdown[]> - Array of geographic breakdown
 */
export const getLiveUsersByGeography = async (
  clickHouseClient: any,
  websiteId: string,
  timeWindowMinutes: number = 30,
  filters: any[] = []
) => {
  // Calculate the timestamp threshold
  const thresholdTime = new Date(
    new Date().getTime() - timeWindowMinutes * 60 * 1000
  );
  const thresholdString = formatDateForClickHouse(thresholdTime);

  // Build WHERE conditions from filters
  const filterConditions = buildFilterConditions(filters);

  const query = `
    SELECT 
      country,
      region,
      city,
      count(DISTINCT visitor_id) as visitor_count,
      count(DISTINCT session_id) as session_count,
      count(*) as event_count
    FROM event
    WHERE website_id = '${websiteId}'
      AND created_at >= '${thresholdString}'
      ${filterConditions ? `AND ${filterConditions}` : ""}
    GROUP BY country, region, city
    ORDER BY visitor_count DESC
  `;

  const resp = await clickHouseClient.query({
    query,
    format: "JSONEachRow",
  });

  return await resp.json();
};

// Type definitions for better TypeScript support
export interface LiveUser {
  visitor_id: string;
  session_id: string;
  identity_id: string;
  email: string;
  last_activity: string;
  session_start: string;
  event_count: number;
  last_page: string;
  last_event_name: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  browser_name: string;
  os_name: string;
  device_model: string;
  event_types: string[];
  pages_visited: string[];
  session_duration_minutes: number;
  is_active: boolean;
  time_since_last_activity_minutes: number;
}

export interface LiveUserSummary {
  total_live_visitors: number;
  total_active_sessions: number;
  total_events: number;
  total_identified_users: number;
  total_countries: number;
  total_cities: number;
  avg_events_per_session: number;
  max_events_in_session: number;
}

export interface GeographicBreakdown {
  country: string;
  region: string;
  city: string;
  visitor_count: number;
  session_count: number;
  event_count: number;
}
