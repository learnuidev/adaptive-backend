import { ClickHouseClient } from "@clickhouse/client";
import { buildDateRange, FilterPeriod } from "./utils.js";

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

// Helper to build WHERE clause with optional filters
function buildWhereClause(filters: {
  websiteId: string;
  country?: string;
  region?: string;
  city?: string;
  browserName?: string;
  osName?: string;
}): { clause: string; params: Record<string, string> } {
  const params: Record<string, string> = { websiteId: filters.websiteId };
  const conditions = [`website_id = {websiteId:String}`];

  if (filters.country) {
    conditions.push(`country = {country:String}`);
    params.country = filters.country;
  }
  if (filters.region) {
    conditions.push(`region = {region:String}`);
    params.region = filters.region;
  }
  if (filters.city) {
    conditions.push(`city = {city:String}`);
    params.city = filters.city;
  }
  if (filters.browserName) {
    conditions.push(`browser_name = {browserName:String}`);
    params.browserName = filters.browserName;
  }
  if (filters.osName) {
    conditions.push(`os_name = {osName:String}`);
    params.osName = filters.osName;
  }

  return { clause: conditions.join(" AND "), params };
}

export interface LsitTotalVisitorsByParams {
  clickHouseClient: ClickHouseClient;
  timezoneName: string;
  websiteId: string;
  period: FilterPeriod;
  from: Date;
  to?: Date;
  country?: string;
  region?: string;
  city?: string;
  browserName?: string;
  osName?: string;
  groupBy: "country" | "region" | "city" | "browser_name" | "os_name";
}
// New: listTotalsVisitorBy with optional filters
export const listTotalsVisitorBy = async ({
  clickHouseClient,
  timezoneName,
  websiteId,
  period,
  from,
  to,
  country,
  region,
  city,
  browserName,
  osName,
  groupBy,
}: LsitTotalVisitorsByParams) => {
  const { startStart, startEnd, previousStartStart, previousStartEnd } =
    buildDateRange({
      period,
      from,
      to,
      timezoneName,
    });

  const { clause, params } = buildWhereClause({
    websiteId,
    country,
    region,
    city,
    browserName,
    osName,
  });

  const buildQuery = (start: string, end?: string, previous = false) => `
    SELECT ${groupBy} as name, COUNT(DISTINCT visitor_id) as visitors
    FROM event
    WHERE ${clause}
      AND type = 'pageview'
      AND created_at >= {${start}:String}
      ${
        period === "custom" && end
          ? `AND created_at <= {${end}:String}`
          : previous && period !== "custom"
            ? `AND created_at < {startStart:String}`
            : ""
      }
    GROUP BY ${groupBy}
    ORDER BY visitors DESC
  `;

  const currentQuery = buildQuery(
    "startStart",
    period === "custom" ? "startEnd" : undefined
  );
  const previousQuery = buildQuery(
    "previousStartStart",
    period === "custom" ? "previousStartEnd" : undefined,
    true
  );

  const current = await clickHouseClient.query({
    query: currentQuery,
    query_params: {
      ...params,
      startStart,
      ...(period === "custom" && { startEnd }),
    },
    format: "JSONEachRow",
  });

  return await current.json();

  //   const previous = await clickHouseClient.query({
  //     query: previousQuery,
  //     query_params: {
  //       ...params,
  //       previousStartStart,
  //       ...(period === "custom" ? { previousStartEnd } : { startStart }),
  //     },
  //     format: "JSONEachRow",
  //   });

  //   return {
  //     current: await current.json(),
  //     previous: await previous.json(),
  //   };
};
