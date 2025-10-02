import middy from "@middy/core";
import cors from "@middy/http-cors";

import { listFeatureFlagsApi } from "./list-features.api.js";

export const handler = middy(async (event) => {
  try {
    const rawParams = JSON.parse(event.body);

    const newFeatureFlag = await listFeatureFlagsApi({
      ...rawParams,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify(newFeatureFlag),
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
