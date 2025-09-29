import { ClickHouseClient } from "@clickhouse/client";
import { FilterPeriod } from "./utils.js";

export const listEventByEmailAndWebsiteId = async ({
  clickHouseClient,
  email,
  websiteId,
}: {
  clickHouseClient: ClickHouseClient;
  websiteId: string;
  period: FilterPeriod;
  from?: string;
  to?: string;
  email: string;
}) => {
  console.log(`Listing events for email: ${email} and websiteId: ${websiteId}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM event WHERE email = '${email}' AND website_id = '${websiteId}' ORDER BY created_at DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};
