import middy from "@middy/core";
import cors from "@middy/http-cors";

import { removeFeatureApi } from "./remove-feature.api.js";

export const handler = middy(async (event) => {
  try {
    const { id } = JSON.parse(event.body);

    const deletedFeature = await removeFeatureApi(id);

    const response = {
      statusCode: 200,
      body: JSON.stringify({ id, deletedAt: Date.now() }),
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
