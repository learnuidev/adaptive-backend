import { testClient } from "./test-client.mjs";

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

async function listGoalsCountByWebsiteId({
  clickHouseClient,
  websiteId,
  periodKey = "all",
  from,
  to,
}) {
  const { start } = buildDateRange(periodKey, from, to);

  const query = `
    SELECT
      metadata['eventName'] AS goal,
      count() AS count
    FROM event
    WHERE website_id = {websiteId:String}
      AND metadata['eventName'] != ''
      AND email IS NOT NULL
      AND created_at >= {start:String}
    GROUP BY goal
    ORDER BY count DESC
  `;

  const result = await clickHouseClient.query({
    query,
    query_params: { websiteId, start },
    format: "JSONEachRow",
  });

  const rows = await result.json();
  return rows;
}

listGoalsCountByWebsiteId({
  clickHouseClient: testClient,
  // websiteId: "01K66XSK34CXMV0TT8ATS953W0",
  websiteId: "01K66Y71NVHBWVFX8T9HB76WXH",
  periodKey: "today",
}).then((resp) => {
  console.log(resp);
});
