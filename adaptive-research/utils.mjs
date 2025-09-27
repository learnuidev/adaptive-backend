const formatDateForClickHouse = (date) => {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
};

const period = {
  last24h: "last24h",
  day: "day",
  week: "week",
  month: "month",
  year: "year",
  ytd: "ytd",
  wtd: "wtd",
  all: "all",
  custom: "custom",
};

const periodCalculators = {
  [period.last24h]: (now) => {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  [period.day]: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      start,
      previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
  },
  [period.week]: (now) => {
    const weekStart = now.getDate() - now.getDay();
    const start = new Date(now.getFullYear(), now.getMonth(), weekStart);
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  [period.month]: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start,
      previousStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    };
  },
  [period.year]: (now) => {
    const start = new Date(now.getFullYear(), 0, 1);
    return {
      start,
      previousStart: new Date(now.getFullYear() - 1, 0, 1),
    };
  },
  [period.ytd]: (now) => {
    const start = new Date(now.getFullYear(), 0, 1);
    return {
      start,
      previousStart: new Date(now.getFullYear() - 1, 0, 1),
    };
  },
  [period.wtd]: (now) => {
    const wtdStart = now.getDate() - now.getDay();
    const start = new Date(now.getFullYear(), now.getMonth(), wtdStart);
    return {
      start,
      previousStart: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
  },
  [period.all]: () => {
    const epoch = new Date(0);
    return { start: epoch, previousStart: epoch };
  },
  [period.custom]: (now, from, to) => {
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

export { buildDateRange, period };
