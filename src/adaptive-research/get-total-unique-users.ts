import { buildDateRange } from "./utils.js";

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
      SELECT toStartOfHour(created_at) as hour, COUNT(DISTINCT visitorId) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
    previousQuery = `
      SELECT toStartOfHour(created_at) as hour, COUNT(DISTINCT visitorId) as total
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
      SELECT toDate(created_at) as day, COUNT(DISTINCT visitorId) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
      GROUP BY day
      ORDER BY day ASC
    `;
    previousQuery = `
      SELECT toDate(created_at) as day, COUNT(DISTINCT visitorId) as total
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
      SELECT toYYYYMM(created_at) as month, COUNT(DISTINCT visitorId) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
      GROUP BY month
      ORDER BY month ASC
    `;
    previousQuery = `
      SELECT toYYYYMM(created_at) as month, COUNT(DISTINCT visitorId) as total
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
      SELECT COUNT(DISTINCT visitorId) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
    `;
    previousQuery = `
      SELECT COUNT(DISTINCT visitorId) as total
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
