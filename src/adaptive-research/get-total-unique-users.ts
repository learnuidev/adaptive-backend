import { buildDateRange } from "./utils.js";

const sample_events = {
  os_version: "10.15.7",
  ipAddress: "45.144.115.137",
  os_name: "macOS",
  device_model: "Macintosh",
  identityId: "01K646SNFB4JZSMBMR3QSJWVF6",
  browser_version: "140.0.0.0",
  email: "learnuidev@gmail.com",
  country: "US",
  city: "Ashburn",
  extraData: {
    contentid: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
    eventName: "content-viewed",
    email: "learnuidev@gmail.com",
  },
  href: "https://www.mandarino.io/convos",
  region: "VA",
  id: "01K646STTAYEA10JXAQX8FZB2K",
  latitude: 39.018,
  domain: "www.mandarino.io",
  visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
  createdAt: 1758930463562,
  sessionId: "sd54b5ada-f54b-46ba-89c9-7e820820ae65",
  browser_name: "Chrome",
  longitude: -77.539,
  websiteId: "mando-prod",
  device_vendor: "Apple",
  timezone: "America/New_York",
  type: "custom",
  viewport: {
    width: 342,
    height: 859,
  },
};

export const getTotalUniqueUsers = async (
  clickHouseClient,
  websiteId,
  period,
  from,
  to
) => {
  const { start, previousStart } = buildDateRange(period, from, to);

  console.log("START", start);
  console.log("previous start", previousStart);

  let currentQuery, previousQuery;

  // Determine grouping based on period
  if (period === "last24h") {
    // Group by hour for last 24 hours
    currentQuery = `
      SELECT toStartOfHour(created_at) as hour, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
    previousQuery = `
      SELECT toStartOfHour(created_at) as hour, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
  } else if (period === "week" || period === "month") {
    // Group by day for week or month
    currentQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
      GROUP BY day
      ORDER BY day ASC
    `;
    previousQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
      GROUP BY day
      ORDER BY day ASC
    `;
  } else if (period === "ytd" || period === "year") {
    // Group by month for year or ytd
    currentQuery = `
      SELECT toYYYYMM(created_at) as month, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
      GROUP BY month
      ORDER BY month ASC
    `;
    previousQuery = `
      SELECT toYYYYMM(created_at) as month, COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
      GROUP BY month
      ORDER BY month ASC
    `;
  } else {
    // Default to total count for other periods
    currentQuery = `
      SELECT COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
    `;
    previousQuery = `
      SELECT COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
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
  };
};
