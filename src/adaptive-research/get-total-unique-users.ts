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

// Response types based on period grouping
type HourlyRecord = { hour: string; total: number };
type DailyRecord = { day: string; total: number };
type MonthlyRecord = { month: number; total: number };

type CurrentPrevious<T> = {
  current: T[];
  previous: T[];
};

// Discriminated union mapping period to return type
type PeriodResultMap = {
  today: CurrentPrevious<DailyRecord>;
  yesterday: CurrentPrevious<DailyRecord>;
  last24h: CurrentPrevious<HourlyRecord>;
  last7d: CurrentPrevious<DailyRecord>;
  last30d: CurrentPrevious<DailyRecord>;
  last12m: CurrentPrevious<DailyRecord>;
  wtd: CurrentPrevious<DailyRecord>;
  mtd: CurrentPrevious<DailyRecord>;
  ytd: CurrentPrevious<MonthlyRecord>;
  all: CurrentPrevious<MonthlyRecord>;
  custom: CurrentPrevious<DailyRecord>;
};

export async function getTotalUniqueUsers<P extends FilterPeriod>({
  clickHouseClient,
  websiteId,
  period,
  from,
  to,
}: {
  clickHouseClient: ClickHouseClient;
  websiteId: string;
  period: P;
  from: string;
  to: string;
  frequency?: "hourly" | "daily" | "weekly" | "monthly";
}): Promise<PeriodResultMap[P]> {
  const { startStart, startEnd, previousStartStart, previousStartEnd } =
    buildDateRange({ period, from, to });

  let currentQuery: string;
  let previousQuery: string;

  // Determine grouping based on period
  if (period === "last24h" || period === "today" || period === "yesterday") {
    // Group by hour for last 24 hours, today, and yesterday
    // can only be hour
    currentQuery = `
      SELECT toStartOfHour(created_at) as hour, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${startStart}'
        AND created_at <= '${startEnd}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
    previousQuery = `
      SELECT toStartOfHour(created_at) as hour, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStartStart}'
        AND created_at <= '${previousStartEnd}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
  } else if (["last7d", "wtd", "mtd", "last7d", "last30d"]?.includes(period)) {
    // Group by day for week, wtd, day, yesterday, today
    currentQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${startStart}'
        AND created_at <= '${startEnd}'
      GROUP BY day
      ORDER BY day ASC
    `;
    previousQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStartStart}'
        AND created_at <= '${previousStartEnd}'
      GROUP BY day
      ORDER BY day ASC
    `;
  } else if (period === "ytd" || period === "all" || period === "last12m") {
    // Group by month for year or ytd
    currentQuery = `
      SELECT toYYYYMM(created_at) as month, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${startStart}'
        AND created_at <= '${startEnd}'
      GROUP BY month
      ORDER BY month ASC
    `;
    previousQuery = `
      SELECT toYYYYMM(created_at) as month, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStartStart}'
        AND created_at <= '${previousStartEnd}'
      GROUP BY month
      ORDER BY month ASC
    `;
  } else if (period === "custom") {
    // Custom period
    currentQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${startStart}'
        AND created_at <= '${startEnd}'
      GROUP BY day
      ORDER BY day ASC
    `;
    previousQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStartStart}'
        AND created_at <= '${previousStartEnd}'
      GROUP BY day
      ORDER BY day ASC
    `;
  } else {
    // Custom period
    currentQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${startStart}'
        AND created_at <= '${startEnd}'
      GROUP BY day
      ORDER BY day ASC
    `;
    previousQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStartStart}'
        AND created_at <= '${previousStartEnd}'
      GROUP BY day
      ORDER BY day ASC
    `;
  }

  const current = await clickHouseClient.query({
    query: currentQuery,
    format: "JSONEachRow",
  });
  const previous = await clickHouseClient.query({
    query: previousQuery,
    format: "JSONEachRow",
  });

  const curr = await current.json();
  const prev = await previous.json();

  return {
    current: curr,
    previous: prev,
  } as PeriodResultMap[P];
}
