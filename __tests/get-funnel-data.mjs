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
    const startStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    const previousStartStart = new Date(
      startStart.getTime() - 24 * 60 * 60 * 1000
    );
    const previousStartEnd = new Date(startEnd.getTime() - 24 * 60 * 60 * 1000);
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  last24h: (now) => {
    const startStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startEnd = new Date(now);
    const previousStartStart = new Date(
      startStart.getTime() - 24 * 60 * 60 * 1000
    );
    const previousStartEnd = new Date(startEnd.getTime() - 24 * 60 * 60 * 1000);
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  last7d: (now) => {
    // This week: Monday to Sunday
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const daysSinceMonday = (dayOfWeek + 6) % 7; // Monday offset
    const startStart = new Date(now);
    startStart.setDate(now.getDate() - daysSinceMonday);
    startStart.setHours(0, 0, 0, 0);

    const startEnd = new Date(startStart);
    startEnd.setDate(startStart.getDate() + 6);
    startEnd.setHours(23, 59, 59, 999);

    // Previous week: Monday to Sunday
    const previousStartStart = new Date(startStart);
    previousStartStart.setDate(startStart.getDate() - 7);

    const previousStartEnd = new Date(startEnd);
    previousStartEnd.setDate(startEnd.getDate() - 7);

    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  last30d: (now) => {
    const startStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startEnd = new Date(now);
    const previousStartStart = new Date(
      startStart.getTime() - 30 * 24 * 60 * 60 * 1000
    );
    const previousStartEnd = new Date(
      startEnd.getTime() - 30 * 24 * 60 * 60 * 1000
    );
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  last12m: (now) => {
    const startStart = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    const startEnd = new Date(now);
    const previousStartStart = new Date(
      startStart.getTime() - 12 * 30 * 24 * 60 * 60 * 1000
    );
    const previousStartEnd = new Date(
      startEnd.getTime() - 12 * 30 * 24 * 60 * 60 * 1000
    );
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  month: (now) => {
    const startStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const startEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const previousStartStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousStartEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  mtd: (now) => {
    const startStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const startEnd = new Date(now);
    const previousStartStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousStartEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  week: (now) => {
    // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = now.getDay();
    // Calculate days to subtract to get to Monday (this week)
    const daysToMonday = (dayOfWeek + 6) % 7; // Monday offset
    const startStart = new Date(now);
    startStart.setDate(now.getDate() - daysToMonday);
    startStart.setHours(0, 0, 0, 0);

    const startEnd = new Date(startStart);
    startEnd.setDate(startStart.getDate() + 6);
    startEnd.setHours(23, 59, 59, 999);

    // Previous week: Monday to Sunday
    const previousStartStart = new Date(startStart);
    previousStartStart.setDate(startStart.getDate() - 7);

    const previousStartEnd = new Date(startEnd);
    previousStartEnd.setDate(startEnd.getDate() - 7);

    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  wtd: (now) => {
    const wtdStart = now.getDate() - now.getDay();
    const startStart = new Date(now.getFullYear(), now.getMonth(), wtdStart);
    const startEnd = new Date(now);
    const previousStartStart = new Date(
      startStart.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const previousStartEnd = new Date(
      startEnd.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  year: (now) => {
    const startStart = new Date(now.getFullYear(), 0, 1);
    const startEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    const previousStartStart = new Date(now.getFullYear() - 1, 0, 1);
    const previousStartEnd = new Date(
      now.getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999
    );
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  ytd: (now) => {
    const startStart = new Date(now.getFullYear(), 0, 1);
    const startEnd = new Date(now);
    const previousStartStart = new Date(now.getFullYear() - 1, 0, 1);
    const previousStartEnd = new Date(
      now.getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999
    );
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  yesterday: (now) => {
    const startStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );
    const startEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      23,
      59,
      59,
      999
    );
    const previousStartStart = new Date(
      startStart.getTime() - 24 * 60 * 60 * 1000
    );
    const previousStartEnd = new Date(startEnd.getTime() - 24 * 60 * 60 * 1000);
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  today: (now) => {
    const startStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startEnd = new Date(now);
    const previousStartStart = new Date(
      startStart.getTime() - 24 * 60 * 60 * 1000
    );
    const previousStartEnd = new Date(startEnd.getTime() - 24 * 60 * 60 * 1000);
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
  all: () => {
    const epoch = new Date(0);
    return {
      startStart: epoch,
      startEnd: new Date(),
      previousStartStart: epoch,
      previousStartEnd: new Date(),
    };
  },
  custom: (now, from, to) => {
    const startStart = new Date(from);
    const startEnd = new Date(to);
    const duration = to.getTime() - from.getTime();
    const previousStartStart = new Date(from.getTime() - duration);
    const previousStartEnd = new Date(to.getTime() - duration);
    return {
      startStart,
      startEnd,
      previousStartStart,
      previousStartEnd,
    };
  },
};

function buildDateRange({
  period,
  from,
  to,
  timezoneName = "America/Montreal",
}) {
  const now = new Date();
  if (!periodCalculators[period]) {
    throw new Error("Invalid period");
  }
  const { startStart, startEnd, previousStartStart, previousStartEnd } =
    period === "custom"
      ? periodCalculators.custom(now, from, to)
      : periodCalculators[period](now);

  return {
    startStart: formatDateForClickHouse(startStart),
    startEnd: formatDateForClickHouse(startEnd),
    previousStartStart: formatDateForClickHouse(previousStartStart),
    previousStartEnd: formatDateForClickHouse(previousStartEnd),
  };

  // return formatTime(
  //   {
  //     startStart: formatDateForClickHouse(startStart),
  //     startEnd: formatDateForClickHouse(startEnd),
  //     previousStartStart: formatDateForClickHouse(previousStartStart),
  //     previousStartEnd: formatDateForClickHouse(previousStartEnd),
  //   },
  //   timezoneName
  // );
}
const getFunnelData = async ({
  clickHouseClient,
  funnelInput,
  websiteId,
  period = "today",
  from,
  to,
}) => {
  const { startStart: start, startEnd: end } = buildDateRange({
    period,
    from,
    to,
  });
  const steps = funnelInput.steps;

  // Build and run step queries
  const stepQueries = steps.map((step, index) => {
    let condition = "";
    if (step.type === "goal") {
      condition = `event_name = '${step.goalName}'`;
    } else if (step.type === "pageview") {
      condition = `type = 'pageview' AND href = '${step.href}'`;
    } else if (step.type === "custom") {
      condition = `event_name = '${step.eventName}'`;
    }

    return `
      SELECT
        visitor_id,
        session_id,
        metadata,
        min(created_at) as ts,
        count() as event_count
      FROM event
      WHERE website_id = '${websiteId}'
        AND ${condition}
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${end.toISOString()}'` : ""}
      GROUP BY visitor_id, session_id, metadata
    `;
  });

  // Execute each step query and collect counts
  const stepResults = await Promise.all(
    stepQueries.map(
      (q) =>
        clickHouseClient
          .query({ query: q, format: "JSONEachRow" })
          .then((r) => r.json())
      // .then((rows) => rows)
    )
  );

  console.log("STEP RESULTS", JSON.stringify(stepResults, null, 4));

  // Build response with actual step counts
  return {
    // funnel: {
    //   id: funnelInput.id,
    //   name: funnelInput.name,
    //   slug: funnelInput.slug,
    //   steps: steps.map((s) => ({
    //     id: s.id,
    //     name: s.name,
    //     type: s.type,
    //     goalName: s.goalName,
    //     goalCompletionType: s.goalCompletionType,
    //     _id: s._id,
    //   })),
    // },
    data: steps.map((step, index) => ({
      id: step?.id,
      name: step?.name,
      value: stepResults[index]?.length,
      revenue: 0,
      stepIndex: index,
      stepType: step.type,
      conversionRate:
        index === 0
          ? 1
          : stepResults[index] / Math.max(stepResults[index - 1]?.length, 1),
      dropoffFromPrevious:
        index === 0
          ? 0
          : Math.max(0, stepResults[index - 1] - stepResults[index]?.length),
      topReferrers: [],
      topCountries: [],
    })),
    metrics: {
      totalVisitors: stepResults[0]?.length || 0,
      completions: stepResults[stepResults.length - 1]?.length || 0,
      overallConversionRate:
        stepResults.length > 1 && stepResults[0]?.length > 0
          ? stepResults[stepResults.length - 1]?.length / stepResults[0]?.length
          : 0,
      overallRevenuePerVisitor: 0,
      period,
      timezone: "UTC",
      lastUpdated: new Date().toISOString(),
    },
  };
};

const funnelInput = {
  websiteId: "68d4c2a24b0000c1caa0dde9",
  name: "Mando Content Funnel",
  slug: "mando-content-funnel",
  steps: [
    {
      id: "_uQrghRE-pgLcFfkUgwPZ",
      name: "View Content",
      type: "goal",
      goalName: "content-viewed",
      goalCompletionType: "completed",
      _id: "68d736c1e5cddd8ba71b401b",
    },
    {
      id: "y8i4B-tNJ0GmAamF6sHmy",
      name: "Click on Transcript",
      type: "goal",
      goalName: "clicked-on-transcript",
      goalCompletionType: "completed",
      _id: "68d736c1e5cddd8ba71b401c",
    },
  ],
  isActive: true,
  createdAt: "2025-09-27T00:58:41.701Z",
  updatedAt: "2025-09-27T00:58:41.701Z",
  id: "68d736c1e5cddd8ba71b401a",
};

getFunnelData({
  clickHouseClient: testClient,
  // websiteId: "01K66XSK34CXMV0TT8ATS953W0",
  websiteId: "01K66Y71NVHBWVFX8T9HB76WXH",
  period: "all",
  funnelInput,
}).then((resp) => {
  console.log(resp);
});
