export const sample_clickhouse_event = {
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

export const formatDateForClickHouse = (date) => {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
};

export const period = {
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

export const timezones = [
  {
    name: "Pacific/Midway",
    offset: -660,
    utcOffsetStr: "GMT+11:00",
    region: "Pacific",
    city: "Midway",
    currentTime: "10:06 AM",
  },
  {
    name: "America/New_York",
    offset: -240,
    utcOffsetStr: "GMT+04:00",
    region: "America",
    city: "New York",
    currentTime: "5:06 PM",
  },
];

export function applyTimezoneOffset(date, timezoneName) {
  const tz = timezones.find((t) => t.name === timezoneName);
  if (!tz) throw new Error("Unknown timezone: " + timezoneName);
  const offsetMs = tz.offset * 60 * 1000;
  return new Date(date.getTime() + offsetMs);
}

export const periodCalculators = {
  day: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(
      localNow.getFullYear(),
      localNow.getMonth(),
      localNow.getDate()
    );
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  last24h: (now, timezoneName) => {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  last7d: (now, timezoneName) => {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  last30d: (now, timezoneName) => {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
  },
  last12m: (now, timezoneName) => {
    const start = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 12 * 30 * 24 * 60 * 60 * 1000),
    };
  },
  month: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    return {
      start,
      previousStart: new Date(
        localNow.getFullYear(),
        localNow.getMonth() - 1,
        1
      ),
    };
  },
  mtd: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    return {
      start,
      previousStart: new Date(
        localNow.getFullYear(),
        localNow.getMonth() - 1,
        1
      ),
    };
  },
  week: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const weekStart = localNow.getDate() - localNow.getDay();
    const start = new Date(
      localNow.getFullYear(),
      localNow.getMonth(),
      weekStart
    );
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  wtd: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const wtdStart = localNow.getDate() - localNow.getDay();
    const start = new Date(
      localNow.getFullYear(),
      localNow.getMonth(),
      wtdStart
    );
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  year: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(localNow.getFullYear(), 0, 1);
    return {
      start,
      previousStart: new Date(localNow.getFullYear() - 1, 0, 1),
    };
  },
  ytd: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(localNow.getFullYear(), 0, 1);
    return {
      start,
      previousStart: new Date(localNow.getFullYear() - 1, 0, 1),
    };
  },
  yesterday: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(
      localNow.getFullYear(),
      localNow.getMonth(),
      localNow.getDate() - 1
    );
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  today: (now, timezoneName) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(
      localNow.getFullYear(),
      localNow.getMonth(),
      localNow.getDate()
    );
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  all: (now, timezoneName) => {
    const epoch = new Date(0);
    return { start: epoch, previousStart: epoch };
  },
  custom: (now, timezoneName, from, to) => {
    const start = new Date(from);
    return {
      start,
      previousStart: new Date(from.getTime() - (to.getTime() - from.getTime())),
    };
  },
};

export function formatTime(
  { start: _start, previousStart: _previousStart },
  timezoneName = "America/Montreal"
) {
  const start = `${_start.split(" ")?.[0]} 00:00:00.000`;
  const previousStart = `${_previousStart.split(" ")?.[0]} 00:00:00.000`;

  // Fixed timezone database with correct offset
  const timezones = {
    "America/Montreal": {
      name: "America/Montreal",
      offset: 240, // +240 minutes = +4 hours (not -240)
      city: "Montreal",
      region: "America",
      offsetStr: "GMT+04:00",
    },
  };

  const targetTimezone = timezones[timezoneName];

  if (!targetTimezone) {
    throw new Error(`Timezone ${timezoneName} not found`);
  }

  const convertTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const offsetMinutes = targetTimezone.offset;
    date.setMinutes(date.getMinutes() + offsetMinutes);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`;
  };

  return {
    start: convertTimestamp(start),
    previousStart: convertTimestamp(previousStart),
  };
}

export function buildDateRange({
  period,
  from,
  to,
  timezoneName = "America/New_York",
}) {
  const now = applyTimezoneOffset(new Date(), timezoneName);
  if (!periodCalculators[period]) {
    throw new Error("Invalid period");
  }
  const { start, previousStart } =
    period === "custom"
      ? periodCalculators.custom(now, timezoneName, from, to)
      : periodCalculators[period](now, timezoneName);

  return {
    start: formatDateForClickHouse(start),
    previousStart: formatDateForClickHouse(previousStart),
  };
}
