import middy from "@middy/core";
import cors from "@middy/http-cors";

import { listTotalsVisitorBy } from "../../../adaptive-research/get-total-visitors-by.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getUserWebsiteById } from "../../user-websites/get-user-website-by-id.api.js";

export const handler = middy(async (event) => {
  try {
    const { websiteId, period, from, to, groupBy } = JSON.parse(event.body);

    const website = await getUserWebsiteById(websiteId);

    const timezoneName = website?.timezoneName || "America/Montreal";

    console.log("yoo");

    const summary = await listTotalsVisitorBy({
      clickHouseClient: clickhouseClient.client,
      timezoneName,
      websiteId: websiteId,
      period: period,
      from: from,
      to: to,
      groupBy,
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify(summary),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        message: err.message,
      }),
    };
    return response;
  }
}).use(cors());
