import { formatDateForClickHouse } from "./utils.js";

/**
 * Get live users for a website based on recent activity
 * Live users are defined as users who have had any event within the specified time window
 * @param clickHouseClient - ClickHouse client instance
 * @param websiteId - Website identifier
 * @param timeWindowMinutes - Time window in minutes to consider a user "live" (default: 30)
 * @returns Promise<LiveUser[]> - Array of live users with their latest activity
 */
export const getLiveUsersByWebsiteId = async (
  clickHouseClient: any,
  websiteId: string,
  timeWindowMinutes: number = 30
) => {
  // Calculate the timestamp threshold
  const now = new Date();
  const thresholdTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
  const thresholdString = formatDateForClickHouse(thresholdTime);

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
      any(city) as city,
      any(browser_name) as browser_name,
      any(os_name) as os_name,
      any(device_model) as device_model,
      groupArray(DISTINCT event_name) as event_types,
      groupArray(DISTINCT href) as pages_visited
    FROM event
    WHERE website_id = '${websiteId}'
      AND created_at >= '${thresholdString}'
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
      (new Date(user.last_activity).getTime() - new Date(user.session_start).getTime()) / (1000 * 60)
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
 * @returns Promise<LiveUserSummary> - Summary of live user statistics
 */
export const getLiveUserSummaryByWebsiteId = async (
  clickHouseClient: any,
  websiteId: string,
  timeWindowMinutes: number = 30
) => {
  // Calculate the timestamp threshold
  const now = new Date();
  const thresholdTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
  const thresholdString = formatDateForClickHouse(thresholdTime);

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
      GROUP BY visitor_id, session_id, identity_id, country, city
    )
  `;

  const resp = await clickHouseClient.query({
    query,
    format: "JSONEachRow",
  });

  const result = await resp.json();
  return result[0] || {
    total_live_visitors: 0,
    total_active_sessions: 0,
    total_events: 0,
    total_identified_users: 0,
    total_countries: 0,
    total_cities: 0,
    avg_events_per_session: 0,
    max_events_in_session: 0,
  };
};

/**
 * Get live users breakdown by geographic location
 * @param clickHouseClient - ClickHouse client instance
 * @param websiteId - Website identifier
 * @param timeWindowMinutes - Time window in minutes to consider a user "live" (default: 30)
 * @returns Promise<GeographicBreakdown[]> - Array of geographic breakdown
 */
export const getLiveUsersByGeography = async (
  clickHouseClient: any,
  websiteId: string,
  timeWindowMinutes: number = 30
) => {
  // Calculate the timestamp threshold
  const thresholdTime = new Date(new Date().getTime() - timeWindowMinutes * 60 * 1000);
  const thresholdString = formatDateForClickHouse(thresholdTime);

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
  city: string;
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
