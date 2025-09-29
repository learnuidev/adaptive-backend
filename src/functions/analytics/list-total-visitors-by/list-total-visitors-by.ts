import middy from "@middy/core";
import cors from "@middy/http-cors";

import { getUserCredentialById } from "../../user-credentials/get-user-credential-by-id.api.js";
import { listTotalsVisitorBy } from "../../../adaptive-research/get-total-visitors-by.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";

export const handler = middy(async (event) => {
  try {
    const { websiteId, period, from, to, groupBy } = JSON.parse(event.body);

    const website = await getUserCredentialById(websiteId);

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
