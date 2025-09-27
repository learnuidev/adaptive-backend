import middy from "@middy/core";
import cors from "@middy/http-cors";
import { addEventsApi } from "./add-events.api.mjs";

import { extractLocationInfo } from "../../utils/extract-location-info";
import { extractDeviceInfo } from "../../utils/extract-device-info";

export const handler = middy(async (event) => {
  const ipAddress = event.requestContext.identity.sourceIp;

  try {
    const rawParams = JSON.parse(event.body);

    const userAgentString =
      event.headers["User-Agent"] || event.headers["user-agent"];

    // eslint-disable-next-line no-unused-vars
    const { deviceType, ...rest } = extractDeviceInfo(userAgentString);

    const location = extractLocationInfo(ipAddress);

    await addEventsApi({
      ...rawParams,
      ipAddress,
      ...location,
      ...rest,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
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
