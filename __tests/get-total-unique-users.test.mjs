import dotenv from "dotenv";
import { createClient } from "@clickhouse/client";

dotenv.config();

const formatDateForClickHouse = (date) => {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
};

const period = {
  today: "today",
  yesterday: "yesterday",
  day: "day",
  week: "week",
  month: "month",
  year: "year",
  last24h: "last24h",
  last7d: "last7d",
  last30d: "last30d",
  last12m: "last12m",
  wtd: "wtd",
  mtd: "mtd",
  ytd: "ytd",
  all: "all",
  custom: "custom",
};

const periodCalculators = {
  day: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  last24h: (now) => {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  last7d: (now) => {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  last30d: (now) => {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
  },
  last12m: (now) => {
    const start = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 12 * 30 * 24 * 60 * 60 * 1000),
    };
  },
  month: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start,
      previousStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    };
  },
  mtd: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start,
      previousStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    };
  },
  week: (now) => {
    const weekStart = now.getDate() - now.getDay();
    const start = new Date(now.getFullYear(), now.getMonth(), weekStart);
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  wtd: (now) => {
    const wtdStart = now.getDate() - now.getDay();
    const start = new Date(now.getFullYear(), now.getMonth(), wtdStart);
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  year: (now) => {
    const start = new Date(now.getFullYear(), 0, 1);
    return {
      start,
      previousStart: new Date(now.getFullYear() - 1, 0, 1),
    };
  },
  ytd: (now) => {
    const start = new Date(now.getFullYear(), 0, 1);
    return {
      start,
      previousStart: new Date(now.getFullYear() - 1, 0, 1),
    };
  },
  yesterday: (now) => {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  today: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  all: () => {
    const epoch = new Date(0);
    return { start: epoch, previousStart: epoch };
  },
  custom: (now, from, to) => {
    const start = new Date(from);
    return {
      start,
      previousStart: new Date(from.getTime() - (to.getTime() - from.getTime())),
    };
  },
};

function buildDateRange(periodKey, from, to) {
  const now = new Date();
  if (!periodCalculators[periodKey]) {
    throw new Error("Invalid period");
  }
  const { start, previousStart } =
    periodKey === period.custom
      ? periodCalculators[period.custom](now, from, to)
      : periodCalculators[periodKey](now);

  return {
    start: formatDateForClickHouse(start),
    previousStart: formatDateForClickHouse(previousStart),
  };
}

const getTotalUniqueUsers = async (
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

const params = {
  // eslint-disable-next-line no-undef
  url: process.env.CLICKHOUSE_URL,
  // eslint-disable-next-line no-undef
  username: process.env.CLICKHOUSE_USERNAME,
  // eslint-disable-next-line no-undef
  password: process.env.CLICKHOUSE_PASSWORD,
};

const client = createClient(params);

getTotalUniqueUsers(
  client,

  "01K66Y71NVHBWVFX8T9HB76WXH",
  "day"
).then((resp) => {
  console.log(resp);
});
