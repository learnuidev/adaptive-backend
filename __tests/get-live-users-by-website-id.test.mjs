import { testClient } from "./test-client.mjs";

const formatDateForClickHouse = (date) => {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
};

/**
 * Build WHERE conditions from filter array
 * @param filters - Array of filter objects with key, operator, and value
 * @returns string - SQL WHERE conditions
 */
function buildFilterConditions(filters) {
  if (!filters || filters.length === 0) {
    return "";
  }

  const conditions = [];

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
function buildStandardCondition(key, operator, value) {
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
function buildMetadataCondition(key, operator, value) {
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
function escapeColumnName(column) {
  // Basic validation - only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
    throw new Error(`Invalid column name: ${column}`);
  }
  return column;
}

/**
 * Escape values for SQL
 */
function escapeValue(value) {
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
function escapeArrayValue(value) {
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
const getLiveUsersByWebsiteId = async (
  clickHouseClient,
  websiteId,
  timeWindowMinutes = 30,
  filters = []
) => {
  // Calculate the timestamp threshold
  const now = new Date();
  const thresholdTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
  const thresholdString = formatDateForClickHouse(thresholdTime);

  // Build WHERE conditions from filters
  const filterConditions = buildFilterConditions(filters);

  console.log("filter conditions", filterConditions);

  // Use a subquery to apply filters before aggregation
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
  return users.map((user) => ({
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

getLiveUsersByWebsiteId(testClient, "01K66XSK34CXMV0TT8ATS953W0", 30, [
  { key: "country", operator: "eq", value: "CA" },
]).then((resp) => {
  console.log("yoo", resp);
});
// getLiveUsersByWebsiteId(testClient, "01K66XSK34CXMV0TT8ATS953W0", 30, []).then(
//   (resp) => {
//     console.log("yoo", resp);
//   }
// );
