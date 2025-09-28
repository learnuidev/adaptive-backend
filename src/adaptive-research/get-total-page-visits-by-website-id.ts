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
export const getTotalPageVisitsByWebsiteId = async ({
  clickHouseClient,
  timezoneName,
  websiteId,
  period,
  from,
  to,
}: {
  clickHouseClient: any;
  timezoneName?: string;
  websiteId: string;
  period: import("./utils.js").FilterPeriod;
  from?: Date;
  to?: Date;
}) => {
  const { startStart, startEnd, previousStartStart, previousStartEnd } =
    buildDateRange({
      period,
      from,
      to,
      timezoneName,
    });

  const currentQuery = `
    SELECT href, COUNT(*) as visits
    FROM event
    WHERE website_id = {websiteId:String}
      AND type = 'pageview'
      AND created_at >= {startStart:String}
      ${period === "custom" ? "AND created_at <= {startEnd:String}" : ""}
    GROUP BY href
    ORDER BY visits DESC
  `;

  const previousQuery = `
    SELECT href, COUNT(*) as visits
    FROM event
    WHERE website_id = {websiteId:String}
      AND type = 'pageview'
      AND created_at >= {previousStartStart:String}
      AND created_at < ${period === "custom" ? "{previousStartEnd:String}" : "{startStart:String}"}
    GROUP BY href
    ORDER BY visits DESC
  `;

  const current = await clickHouseClient.query({
    query: currentQuery,
    query_params: {
      websiteId,
      startStart,
      ...(period === "custom" && { startEnd }),
    },
    format: "JSONEachRow",
  });

  const previous = await clickHouseClient.query({
    query: previousQuery,
    query_params: {
      websiteId,
      previousStartStart,
      ...(period === "custom" ? { previousStartEnd } : { startStart }),
    },
    format: "JSONEachRow",
  });

  return {
    current: await current.json(),
    previous: await previous.json(),
    startStart,
    startEnd,
    previousStartStart,
    previousStartEnd,
  };
};
