import middy from "@middy/core";
import cors from "@middy/http-cors";
import { identifyApi } from "./identify.api.js";
import { extractLocationInfo } from "../../utils/extract-location-info.js";
import { extractDeviceInfo } from "../../utils/extract-device-info.js";
import { validateWebSiteId } from "../auth/validate-website-id.js";

export const handler = middy(async (event: any) => {
  const ipAddress = event.requestContext.identity.sourceIp;

  const response = {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };

  return response;

  try {
    await validateWebSiteId(event);

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
        // @ts-ignore
        message: err.message,
      }),
    };
  }
}).use(cors());
