import { timezones } from "./timezones.js";

export const formatDateForClickHouse = (date) => {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
};

export type FilterPeriod =
  | "today"
  | "yesterday"
  | "day"
  | "week"
  | "month"
  | "year"
  | "last24h"
  | "last7d"
  | "last30d"
  | "last12m"
  | "wtd"
  | "mtd"
  | "ytd"
  | "all"
  | "custom";

const period: Record<FilterPeriod, FilterPeriod> = {
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


function formatTime(
  { start: _start, previousStart: _previousStart },
  timezoneName = "America/Montreal"
) {
  const start = `${_start.split(" ")?.[0]} 00:00:00.000`;
  const previousStart = `${_previousStart.split(" ")?.[0]} 00:00:00.000`;

  // Fixed timezone database with correct offset


  const targetTimezone = timezones?.find(tz => tz.name === timezoneName)

  if (!targetTimezone) {
    throw new Error(`Timezone ${timezoneName} not found`);
  }

  const convertTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const offsetMinutes = (targetTimezone.offset) * -1;
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


function buildDateRange({period, from, to, timezoneName}: {periodKey: FilterPeriod, from?: Date, to?: Date, timezoneName: string = "America/Montreal"}) {
  const now = new Date();
  if (!periodCalculators[period]) {
    throw new Error("Invalid period");
  }
  const { start, previousStart } =
    period === period.custom
      ? periodCalculators[period.custom](now, from, to)
      : periodCalculators[period](now)

  return formatTime({
    start: formatDateForClickHouse(start),
    previousStart: formatDateForClickHouse(previousStart),
  }, timezoneName)
}

export function addParamToRoutes(routes: any) {
  function extractPattern(route) {
    // Match something like /section/value, return /section/[param]
    const match = route.match(/^\/([^/]+)\/[^/]+$/);
    if (match) {
      return `/${match[1]}/[param]`;
    }
    return null;
  }

  const extended = routes?.map((item) => {
    const url = new URL(item.href);
    const pattern = extractPattern(url.pathname);
    // Compose patternHref as full origin + pattern
    return pattern ? { ...item, patternHref: url.origin + pattern } : item;
  });

  return extended;
}

export { buildDateRange, period };
