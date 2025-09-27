import middy from "@middy/core";
import cors from "@middy/http-cors";

import { addFeatureFlagsApi } from "./add-feature-flag.api";

export const handler = middy(async (event) => {
  try {
    const rawParams = JSON.parse(event.body);

    const newFeatureFlag = await addFeatureFlagsApi({
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
