import middy from "@middy/core";
import cors from "@middy/http-cors";
import { addEventsApi } from "./add-events.api.js";

import { extractLocationInfo } from "../../utils/extract-location-info.js";
import { extractDeviceInfo } from "../../utils/extract-device-info.js";
import { validateWebSiteId } from "../auth/validate-website-id.js";

export const handler = middy(async (event: any) => {
  const ipAddress = event.requestContext.identity.sourceIp;

  try {
    await validateWebSiteId(event);

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
        // @ts-ignore
        message: err.message,
      }),
    };
    return response;
  }
}).use(cors());
