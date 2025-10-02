import middy from "@middy/core";
import cors from "@middy/http-cors";

import { listCohortsApi } from "./list-cohorts.api.js";

export const handler = middy(async (event) => {
  try {
    const rawParams = JSON.parse(event.body);

    const cohorts = await listCohortsApi({
      ...rawParams,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify(cohorts),
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
