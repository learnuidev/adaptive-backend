import middy from "@middy/core";
import cors from "@middy/http-cors";

import { listCohortUsers } from "../../../adaptive-research/cohorts/list-cohort-users.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getCohortById } from "./get-cohort.api.js";

export const handler = middy(async (event) => {
  try {
    // @ts-ignore
    const rawParams = JSON.parse(event.body);

    const { cohortId } = rawParams;

    const cohort = await getCohortById({ cohortId });

    if (!cohort) {
      throw new Error("Cohort not found");
    }

    const cohortUsers = await listCohortUsers({
      clickHouseClient: clickhouseClient.client,
      cohort,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify(cohortUsers),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        // @ts-ignore
        message: err.message,
      }),
    };
    return response;
  }
}).use(cors());
