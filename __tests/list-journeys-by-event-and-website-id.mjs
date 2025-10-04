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

async function listJourneyByEventAndWebsiteId({
  clickHouseClient,
  eventId,
  websiteId,
  goalName,
  selectedKeys = ["*"],
}) {
  // First, fetch the goal event to get the visitor_id, session_id and created_at
  const goalEventQuery = `
    SELECT visitor_id, session_id, created_at
    FROM event
    WHERE id = {eventId:String}
      AND website_id = {websiteId:String}
      ${goalName ? "AND metadata['eventName'] = {goalName:String}" : ""}
    LIMIT 1
  `;
  const goalEventResult = await clickHouseClient.query({
    query: goalEventQuery,
    query_params: { eventId, websiteId, ...(goalName && { goalName }) },
    format: "JSONEachRow",
  });
  const goalEventRows = await goalEventResult.json();
  if (!goalEventRows.length) {
    return [];
  }
  const {
    visitor_id,
    session_id,
    created_at: goalCreatedAt,
  } = goalEventRows[0];

  let selectFields;
  if (selectedKeys.length === 1 && selectedKeys[0] === "*") {
    selectFields = "*";
  } else {
    selectFields = selectedKeys
      .map((key) => {
        switch (key) {
          case "id":
            return "id";
          case "email":
            return "email";
          case "eventName":
            return "metadata['eventName'] AS eventName";
          case "created_at":
            return "created_at";
          default:
            return key;
        }
      })
      .filter(Boolean)
      .join(",\n      ");
  }

  // Fetch all events for this visitor and session up to the goal event time
  const journeyQuery = `
    SELECT
      ${selectFields}
    FROM event
    WHERE visitor_id = {visitorId:String}
      AND session_id = {sessionId:String}
      AND website_id = {websiteId:String}
      AND created_at <= {goalCreatedAt:String}
    ORDER BY created_at ASC
  `;

  const journeyResult = await clickHouseClient.query({
    query: journeyQuery,
    query_params: {
      visitorId: visitor_id,
      sessionId: session_id,
      websiteId,
      goalCreatedAt,
    },
    format: "JSONEachRow",
  });

  const rows = await journeyResult.json();

  if (selectedKeys.length === 1 && selectedKeys[0] === "*") {
    return rows;
  }

  return rows.map((row) => {
    const mapped = {};
    selectedKeys.forEach((key) => {
      if (key === "eventName") {
        mapped.eventName = row.eventName;
      } else if (key in row) {
        mapped[key] = row[key];
      }
    });
    return mapped;
  });
}

// Example usage:
listJourneyByEventAndWebsiteId({
  clickHouseClient: testClient,
  eventId: "01K6DVHEQG2VXV1XBPVJFAKW1G",
  websiteId: "01K66XSK34CXMV0TT8ATS953W0",
  selectedKeys: ["id", "type", "href", "session_id", "created_at"],
}).then((resp) => {
  console.log(resp);
});

// listJourneyByEventAndWebsiteId({
//   clickHouseClient: testClient,
//   eventId: "01K6PJY7JEJWCD0FPNK6Q8K7Y3",
//   goalName: "content-viewed",
//   websiteId: "01K66Y71NVHBWVFX8T9HB76WXH",
//   selectedKeys: ["*"],
// }).then((resp) => {
//   console.log(resp);
// });
