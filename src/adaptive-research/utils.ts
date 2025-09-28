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

const timezones = [
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

function applyTimezoneOffset(date: Date, timezoneName: string): Date {
  const tz = timezones.find((t) => t.name === timezoneName);
  if (!tz) throw new Error("Unknown timezone: " + timezoneName);
  const offsetMs = tz.offset * 60 * 1000;
  return new Date(date.getTime() + offsetMs);
}

const periodCalculators = {
  day: (now: Date, timezoneName: string) => {
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
  last24h: (now: Date, timezoneName: string) => {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  last7d: (now: Date, timezoneName: string) => {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  last30d: (now: Date, timezoneName: string) => {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
  },
  last12m: (now: Date, timezoneName: string) => {
    const start = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 12 * 30 * 24 * 60 * 60 * 1000),
    };
  },
  month: (now: Date, timezoneName: string) => {
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
  mtd: (now: Date, timezoneName: string) => {
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
  week: (now: Date, timezoneName: string) => {
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
  wtd: (now: Date, timezoneName: string) => {
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
  year: (now: Date, timezoneName: string) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(localNow.getFullYear(), 0, 1);
    return {
      start,
      previousStart: new Date(localNow.getFullYear() - 1, 0, 1),
    };
  },
  ytd: (now: Date, timezoneName: string) => {
    const localNow = applyTimezoneOffset(now, timezoneName);
    const start = new Date(localNow.getFullYear(), 0, 1);
    return {
      start,
      previousStart: new Date(localNow.getFullYear() - 1, 0, 1),
    };
  },
  yesterday: (now: Date, timezoneName: string) => {
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
  today: (now: Date, timezoneName: string) => {
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
  all: (now: Date, timezoneName: string) => {
    const epoch = new Date(0);
    return { start: epoch, previousStart: epoch };
  },
  custom: (now: Date, timezoneName: string, from: Date, to: Date) => {
    const start = new Date(from);
    return {
      start,
      previousStart: new Date(from.getTime() - (to.getTime() - from.getTime())),
    };
  },
};

function buildDateRange({
  period,
  from,
  to,
  timezoneName = "America/New_York",
}: {
  period: FilterPeriod;
  from?: Date;
  to?: Date;
  timezoneName?: string;
}) {
  const now = applyTimezoneOffset(new Date(), timezoneName);
  if (!periodCalculators[period]) {
    throw new Error("Invalid period");
  }
  const { start, previousStart } =
    period === period.custom
      ? periodCalculators[period.custom](now, timezoneName, from!, to!)
      : periodCalculators[period](now, timezoneName);

  return {
    start: formatDateForClickHouse(start),
    previousStart: formatDateForClickHouse(previousStart),
  };
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
