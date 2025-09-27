import middy from "@middy/core";
import cors from "@middy/http-cors";
import { identifyApi } from "./identify.api.mjs/index.js";
import { extractLocationInfo } from "../../utils/extract-location-info.js";
import { extractDeviceInfo } from "../../utils/extract-device-info.js";

export const handler = middy(async (event) => {
  const ipAddress = event.requestContext.identity.sourceIp;

  try {
    const rawParams = JSON.parse(event.body);

    if (!rawParams.email) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Email not provided! Not tracked" }),
      };
    }

    const userAgentString =
      event.headers["User-Agent"] || event.headers["user-agent"];

    const { deviceType, ...restDeviceInfo } =
      extractDeviceInfo(userAgentString);

    const emailAndDeviceType = `${rawParams?.email}#${deviceType}#${rawParams?.websiteId}`;

    const location = extractLocationInfo(ipAddress);

    const params = {
      ipAddress,
      email: rawParams.email,
      websiteId: rawParams.websiteId,
      emailAndDeviceType,
      ...location,
      ...restDeviceInfo,
    };

    const newIdentity = await identifyApi(params);

    return {
      statusCode: 200,
      body: JSON.stringify(newIdentity),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: err.message,
      }),
    };
  }
}).use(cors());
