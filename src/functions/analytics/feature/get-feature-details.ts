import middy from "@middy/core";
import cors from "@middy/http-cors";

import { getFeatureDetailsApi } from "./get-feature-details.api.js";

export const handler = middy(async (event) => {
  try {
    // @ts-ignore
    const rawParams = JSON.parse(event.body);

    const featureDetails = await getFeatureDetailsApi({
      id: rawParams.id,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify(featureDetails),
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
