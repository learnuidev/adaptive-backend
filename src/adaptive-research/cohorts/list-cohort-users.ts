import dotenv from "dotenv";
import { ClickHouseClient, createClient } from "@clickhouse/client";
import { processRolloutRules } from "adaptive.fyi";

export async function listCohortUsers({
  clickHouseClient,
  cohort,
}: {
  clickHouseClient: ClickHouseClient;
  cohort: any;
}) {
  const query = processRolloutRules(cohort.websiteId, cohort.cohortRules, {
    buildAll: true,
    selectors: ["email", "visitor_id"],
  });

  const currentResp = await clickHouseClient.query({
    query: query[0],

    format: "JSONEachRow",
  });

  const current = await currentResp.json();

  return current;
}
