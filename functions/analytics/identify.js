const middy = require("@middy/core");
const cors = require("@middy/http-cors");
const UAParser = require("ua-parser-js");
const { identifyApi } = require("./identify.api");

module.exports.handler = middy(async (event) => {
  const ipAddress = event.requestContext.identity.sourceIp;

  try {
    // Extract the User-Agent header from the event headers
    const userAgentString =
      event.headers["User-Agent"] || event.headers["user-agent"];

    // Parse the User-Agent string
    const parser = new UAParser(userAgentString);
    const uaResult = parser.getResult();

    const rawParams = JSON.parse(event.body);

    const newIdentify = await identifyApi({
      ...rawParams,
      ipAddress,
      userAgentInfo: uaResult,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify(newIdentify),
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
