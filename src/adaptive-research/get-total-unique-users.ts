import { buildDateRange } from "./utils.js";

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

export const getTotalUniqueUsers = async (
  clickHouseClient,
  websiteId,
  period,
  from,
  to
) => {
  const { start, previousStart } = buildDateRange({ period, from, to });

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
  } else if (
    period === "week" ||
    period === "wtd" ||
    period === "day" ||
    period === "yesterday" ||
    period === "today"
  ) {
    // Group by day for week, wtd, day, yesterday, today
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
  } else if (
    period === "month" ||
    period === "mtd" ||
    period === "last7d" ||
    period === "last30d" ||
    period === "last12m"
  ) {
    // Group by day for month, mtd, last7d, last30d, last12m
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
  } else if (period === "all") {
    // No grouping for all time
    currentQuery = `
      SELECT COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
    `;
    // Fixed: previous query now uses the same time window as current but shifted back
    previousQuery = `
      SELECT COUNT(DISTINCT email) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at < '${start}'
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

// export const getTotalUniqueUsers = async (
//   clickHouseClient,
//   websiteId,
//   period,
//   from,
//   to
// ) => {
//   const { start, previousStart } = buildDateRange(period, from, to);

//   console.log("START", start);
//   console.log("previous start", previousStart);

//   let currentQuery, previousQuery;

//   // Determine grouping based on period
//   if (period === "last24h") {
//     // Group by hour for last 24 hours
//     currentQuery = `
//       SELECT toStartOfHour(created_at) as hour, COUNT(DISTINCT email) as total
//       FROM event
//       WHERE website_id = '${websiteId}'
//         AND created_at >= '${start}'
//       GROUP BY hour
//       ORDER BY hour ASC
//     `;
//     previousQuery = `
//       SELECT toStartOfHour(created_at) as hour, COUNT(DISTINCT email) as total
//       FROM event
//       WHERE website_id = '${websiteId}'
//         AND created_at >= '${previousStart}'
//         AND created_at < '${start}'
//       GROUP BY hour
//       ORDER BY hour ASC
//     `;
//   } else if (period === "week" || period === "month") {
//     // Group by day for week or month
//     currentQuery = `
//       SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
//       FROM event
//       WHERE website_id = '${websiteId}'
//         AND created_at >= '${start}'
//         ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
//       GROUP BY day
//       ORDER BY day ASC
//     `;
//     previousQuery = `
//       SELECT toDate(created_at) as day, COUNT(DISTINCT email) as total
//       FROM event
//       WHERE website_id = '${websiteId}'
//         AND created_at >= '${previousStart}'
//         AND created_at < '${start}'
//       GROUP BY day
//       ORDER BY day ASC
//     `;
//   } else if (period === "ytd" || period === "year") {
//     // Group by month for year or ytd
//     currentQuery = `
//       SELECT toYYYYMM(created_at) as month, COUNT(DISTINCT email) as total
//       FROM event
//       WHERE website_id = '${websiteId}'
//         AND created_at >= '${start}'
//         ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
//       GROUP BY month
//       ORDER BY month ASC
//     `;
//     previousQuery = `
//       SELECT toYYYYMM(created_at) as month, COUNT(DISTINCT email) as total
//       FROM event
//       WHERE website_id = '${websiteId}'
//         AND created_at >= '${previousStart}'
//         AND created_at < '${start}'
//       GROUP BY month
//       ORDER BY month ASC
//     `;
//   } else {
//     // Default to total count for other periods
//     currentQuery = `
//       SELECT COUNT(DISTINCT email) as total
//       FROM event
//       WHERE website_id = '${websiteId}'
//         AND created_at >= '${start}'
//         ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
//     `;
//     previousQuery = `
//       SELECT COUNT(DISTINCT email) as total
//       FROM event
//       WHERE website_id = '${websiteId}'
//         AND created_at >= '${previousStart}'
//         AND created_at < '${start}'
//     `;
//   }

//   const current = await clickHouseClient.query({
//     query: currentQuery,
//     format: "JSONEachRow",
//   });
//   const previous = await clickHouseClient.query({
//     query: previousQuery,
//     format: "JSONEachRow",
//   });

//   const curr = await current.json();
//   const prev = await previous.json();

//   return {
//     current: curr,
//     previous: prev,
//   };
// };
