import middy from "@middy/core";
import cors from "@middy/http-cors";

import { getSummaryApi } from "./get-summary.api.js";

export const handler = middy(async (event) => {
  try {
    const { websiteId, period, from, to } = JSON.parse(event.body);

    console.log("yoo");

    const summary = await getSummaryApi({
      websiteId,
      period,
      from: new Date(from),
      to: new Date(to),
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
