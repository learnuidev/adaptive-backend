import { ClickHouseClient } from "@clickhouse/client";
import { buildDateRange, FilterPeriod } from "./utils.js";
// import { buildDateRange } from "./clickhouse.js";

export interface ListGoalsCountByWebsiteIdParams {
  clickHouseClient: ClickHouseClient;
  websiteId: string;
  period?: FilterPeriod;
  from?: string;
  to?: string;
}
export async function listGoalsCountByWebsiteId({
  clickHouseClient,
  websiteId,
  period = "all",
  from,
  to,
}: ListGoalsCountByWebsiteIdParams) {
  const { start } = buildDateRange(period, from, to);

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
