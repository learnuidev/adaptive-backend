import { timezones } from "./timezones.js";

function formatTime(
  {
    startStart: _startStart,
    startEnd: _startEnd,
    previousStartStart: _previousStartStart,
    previousStartEnd: _previousStartEnd,
  },
  timezoneName = "America/Montreal"
) {
  const startStart = `${_startStart.split(" ")?.[0]} 00:00:00.000`;
  const startEnd = `${_startEnd.split(" ")?.[0]} 23:59:59.999`;
  const previousStartStart = `${_previousStartStart.split(" ")?.[0]} 00:00:00.000`;
  const previousStartEnd = `${_previousStartEnd.split(" ")?.[0]} 23:59:59.999`;

  // Fixed timezone database with correct offset

  const targetTimezone = timezones?.find((tz) => tz.name === timezoneName);

  if (!targetTimezone) {
    throw new Error(`Timezone ${timezoneName} not found`);
  }

  const convertTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const offsetMinutes = targetTimezone.offset * -1;
    date.setMinutes(date.getMinutes() + offsetMinutes);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  return {
    startStart: convertTimestamp(startStart),
    startEnd: convertTimestamp(startEnd),
    previousStartStart: convertTimestamp(previousStartStart),
    previousStartEnd: convertTimestamp(previousStartEnd),
  };
}

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
}: {
  period: FilterPeriod;
  from?: Date;
  to?: Date;
  timezoneName?: string;
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
