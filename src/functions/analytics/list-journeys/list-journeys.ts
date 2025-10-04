import middy from "@middy/core";
import cors from "@middy/http-cors";

import { listJourneysApi } from "./list-journeys.api.js";

export const handler = middy(async (event) => {
  try {
    // @ts-ignore
    const params = JSON.parse(event.body);

    console.log("yoo");

    const journeys = await listJourneysApi(params);
    const response = {
      statusCode: 200,
      body: JSON.stringify(journeys),
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
