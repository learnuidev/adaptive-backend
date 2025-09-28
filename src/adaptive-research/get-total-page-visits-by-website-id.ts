import { buildDateRange, formatDateForClickHouse } from "./utils.js";

const sample_clickhouse_event = {
  id: "01K646STTAYEA10JXAQX8FZB2K",
  visitor_id: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
  session_id: "sd54b5ada-f54b-46ba-89c9-7e820820ae65",
  identity_id: "01K646SNFB4JZSMBMR3QSJWVF6",
  website_id: "mando-prod",
  type: "custom",
  event_name: "content-viewed",
  content_id: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
  href: "https://www.mandarino.io/convos",
  domain: "www.mandarino.io",
  created_at: "2025-09-28 05:59:48.290",
  email: "learnuidev@gmail.com",
  ip_address: "45.144.115.137",
  country: "US",
  region: "VA",
  city: "Ashburn",
  latitude: 39.018,
  longitude: -77.539,
  timezone: "America/New_York",
  os_name: "macOS",
  os_version: "10.15.7",
  browser_name: "Chrome",
  browser_version: "140.0.0.0",
  device_vendor: "Apple",
  device_model: "Macintosh",
  viewport_width: 342,
  viewport_height: 859,
  metadata: {
    contentid: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
    eventName: "content-viewed",
    email: "learnuidev@gmail.com",
  },
};

// First, let's add the missing addParamToRoutes function
const addParamToRoutes = (routes) => {
  return routes.map((route) => ({
    ...route,
    // Add any additional parameters you need here
    // For example, you might want to calculate percentages or add metadata
  }));
};

export const getTotalPageVisitsByWebsiteId = async (
  clickHouseClient,
  websiteId,
  period,
  from,
  to
) => {
  const { start, previousStart } = buildDateRange(period, from, to);

  // Format the 'to' date for custom period
  const endDate = period === "custom" ? formatDateForClickHouse(to) : null;

  // Use parameterized queries to prevent SQL injection
  const currentQuery = `
    SELECT href, COUNT(*) as visits
    FROM event
    WHERE website_id = {websiteId:String}
      AND type = 'pageview'
      AND created_at >= {start:String}
      ${period === "custom" ? "AND created_at <= {endDate:String}" : ""}
    GROUP BY href
    ORDER BY visits DESC
  `;

  const previousQuery = `
    SELECT href, COUNT(*) as visits
    FROM event
    WHERE website_id = {websiteId:String}
      AND type = 'pageview'
      AND created_at >= {previousStart:String}
      AND created_at < {start:String}
    GROUP BY href
    ORDER BY visits DESC
  `;

  // Execute queries with parameters
  const current = await clickHouseClient.query({
    query: currentQuery,
    query_params: {
      websiteId,
      start,
      ...(period === "custom" && { endDate }),
    },
    format: "JSONEachRow",
  });

  const previous = await clickHouseClient.query({
    query: previousQuery,
    query_params: {
      websiteId,
      start,
      previousStart,
    },
    format: "JSONEachRow",
  });

  return {
    current: addParamToRoutes(await current.json()),
    previous: addParamToRoutes(await previous.json()),
  };
};
