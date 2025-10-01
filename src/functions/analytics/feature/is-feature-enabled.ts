import middy from "@middy/core";
import cors from "@middy/http-cors";

import { validateWebSiteId } from "../../auth/validate-website-id.js";

export const handler = middy(async (event) => {
  try {
    await validateWebSiteId(event);

    const response = {
      statusCode: 200,
      // todo: implement this
      body: JSON.stringify({ enabled: true }),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        enabled: true,
      }),
    };
    return response;
  }
}).use(cors());
