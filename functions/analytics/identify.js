const middy = require("@middy/core");
const cors = require("@middy/http-cors");
const UAParser = require("ua-parser-js");
const { identifyApi } = require("./identify.api");

module.exports.handler = middy(async (event) => {
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

    const parser = new UAParser(userAgentString);
    const uaResult = parser.getResult();

    const os = `${uaResult.os?.name || ""}_${uaResult.os?.version || ""}`;
    const device = `${uaResult.device?.model || ""}_${uaResult.device?.vendor || ""}`;
    const browser = `${uaResult.browser?.name || ""}_${uaResult.browser?.version || ""}`;

    const deviceType = `${os}#${device}#${browser}`;

    const emailAndDeviceType = `${rawParams.email}#${deviceType}#${rawParams.websiteId}`;

    const newIdentify = await identifyApi({
      ipAddress,
      email: rawParams.email,
      websiteId: rawParams.websiteId,
      emailAndDeviceType,
      userAgentInfo: {
        browser: uaResult.browser,
        device: uaResult.device,
        os: uaResult.os,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(newIdentify),
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
