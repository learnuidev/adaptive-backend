const formatDateForClickHouse = (date) => {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
};

function buildDateRange(period, from, to) {
  const now = new Date();
  let start, previousStart;
  switch (period) {
    case "last24h":
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "day":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      const weekStart = now.getDate() - now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), weekStart);
      previousStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      break;
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      break;
    case "wtd":
      const wtdStart = now.getDate() - now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), wtdStart);
      previousStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      start = new Date(0);
      previousStart = new Date(0);
      break;
    case "custom":
      start = new Date(from);
      previousStart = new Date(
        from.getTime() - (to.getTime() - from.getTime())
      );
      break;
    default:
      throw new Error("Invalid period");
  }

  return {
    start: formatDateForClickHouse(start),
    previousStart: formatDateForClickHouse(previousStart),
  };
}

module.exports = {
  buildDateRange,
};
