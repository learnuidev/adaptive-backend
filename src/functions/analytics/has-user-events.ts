import middy from "@middy/core";
import cors from "@middy/http-cors";
import { APIGatewayEvent } from "aws-lambda";

import { hasUserEventsApi } from "./has-user-events.api.js";

export const handler = middy(async (event: APIGatewayEvent) => {
  const userId = event.requestContext.authorizer?.claims?.email;
  try {
    const { websiteId } = JSON.parse(event.body || "{}");

    const hasUserEvents = await hasUserEventsApi({
      websiteId,
      userId,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify(hasUserEvents),
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
