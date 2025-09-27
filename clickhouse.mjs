import dotenv from "dotenv";
import { createClient } from "@clickhouse/client";

dotenv.config();

const params = {
  // eslint-disable-next-line no-undef
  url: process.env.CLICKHOUSE_URL,
  // eslint-disable-next-line no-undef
  username: process.env.CLICKHOUSE_USERNAME,
  // eslint-disable-next-line no-undef
  password: process.env.CLICKHOUSE_PASSWORD,
};

const client = createClient(params);

const hasUserEvents = async (clickHouseClient, websiteId) => {
  const resp = await clickHouseClient.query({
    query: `
      SELECT 1
      FROM event
      WHERE website_id = '${websiteId}'
      LIMIT 1
    `,
    format: "JSONEachRow",
  });
  const rows = await resp.json();
  return rows.length > 0;
};

hasUserEvents(client, "mando-prod").then((resp) => {
  console.log(resp);
});
