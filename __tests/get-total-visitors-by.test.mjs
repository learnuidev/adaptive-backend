import { buildDateRange } from "./helpers.mjs";
import { testClient } from "./test-client.mjs";

// Helper to build WHERE clause with optional filters
function buildWhereClause(filters) {
  const params = { websiteId: filters.websiteId };
  const conditions = [`website_id = {websiteId:String}`];

  if (filters.country) {
    conditions.push(`country = {country:String}`);
    params.country = filters.country;
  }
  if (filters.region) {
    conditions.push(`region = {region:String}`);
    params.region = filters.region;
  }
  if (filters.city) {
    conditions.push(`city = {city:String}`);
    params.city = filters.city;
  }
  if (filters.browserName) {
    conditions.push(`browser_name = {browserName:String}`);
    params.browserName = filters.browserName;
  }
  if (filters.osName) {
    conditions.push(`os_name = {osName:String}`);
    params.osName = filters.osName;
  }

  return { clause: conditions.join(" AND "), params };
}

// New: listTotalsVisitorBy with optional filters
export const listTotalsVisitorBy = async ({
  clickHouseClient,
  timezoneName,
  websiteId,
  period,
  from,
  to,
  country,
  region,
  city,
  browserName,
  osName,
  groupBy,
}) => {
  const { startStart, startEnd, previousStartStart, previousStartEnd } =
    buildDateRange({
      period,
      from,
      to,
      timezoneName,
    });

  const { clause, params } = buildWhereClause({
    websiteId,
    country,
    region,
    city,
    browserName,
    osName,
  });

  const buildQuery = (start, end, previous = false) => {
    let selectClause;
    if (groupBy === "device") {
      selectClause = `
        CASE
          WHEN viewport_width <= 768 THEN 'mobile'
          WHEN viewport_width <= 1024 THEN 'tablet'
          ELSE 'desktop'
        END as name
      `;
    } else {
      selectClause = `${groupBy} as name`;
    }

    return `
      SELECT ${selectClause}, COUNT(DISTINCT visitor_id) as visitors
      FROM event
      WHERE ${clause}
        AND type = 'pageview'
        AND created_at >= {${start}:String}
        ${
          period === "custom" && end
            ? `AND created_at <= {${end}:String}`
            : previous && period !== "custom"
              ? `AND created_at < {startStart:String}`
              : ""
        }
      GROUP BY name
      ORDER BY visitors DESC
    `;
  };

  const currentQuery = buildQuery(
    "startStart",
    period === "custom" ? "startEnd" : undefined
  );
  const previousQuery = buildQuery(
    "previousStartStart",
    period === "custom" ? "previousStartEnd" : undefined,
    true
  );

  const current = await clickHouseClient.query({
    query: currentQuery,
    query_params: {
      ...params,
      startStart,
      ...(period === "custom" && { startEnd }),
    },
    format: "JSONEachRow",
  });

  return await current.json();

  //   const previous = await clickHouseClient.query({
  //     query: previousQuery,
  //     query_params: {
  //       ...params,
  //       previousStartStart,
  //       ...(period === "custom" ? { previousStartEnd } : { startStart }),
  //     },
  //     format: "JSONEachRow",
  //   });

  //   return {
  //     current: await current.json(),
  //     previous: await previous.json(),
  //   };
};

listTotalsVisitorBy({
  clickHouseClient: testClient,
  timezoneName: "America/New_York",
  websiteId: "01K66XSK34CXMV0TT8ATS953W0",
  period: "ytd",
  groupBy: "device",
  //   country: "GB",
  // city: "New York",
}).then((resp) => {
  console.log("yo", resp);
});

const regionResponse = [
  { name: "IDF", visitors: "1" },
  { name: "IL", visitors: "1" },
  { name: "ENG", visitors: "1" },
  { name: "MI", visitors: "1" },
  { name: "QC", visitors: "1" },
  { name: "NY", visitors: "1" },
];

// listTotalsVisitorBy({
//   clickHouseClient: testClient,
//   timezoneName: "America/New_York",
//   websiteId: "01K66XSK34CXMV0TT8ATS953W0",
//   period: "day",
//   from: "2024-01-01",
//   to: "2024-01-07",
//   groupBy: "os_name",
// }).then((resp) => {
//   console.log("yo", resp);
// });

// listTotalsVisitorBy({
//   clickHouseClient: testClient,
//   timezoneName: "America/New_York",
//   websiteId: "01K66XSK34CXMV0TT8ATS953W0",
//   period: "day",
//   from: "2024-01-01",
//   to: "2024-01-07",
//   groupBy: "browser_name",
// }).then((resp) => {
//   console.log("yo", resp);
// });
