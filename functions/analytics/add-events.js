const middy = require("@middy/core");
const cors = require("@middy/http-cors");
const { addEventsApi } = require("./add-events.api");

module.exports.handler = middy(async (event) => {
  const ipAddress = event.requestContext.identity.sourceIp;

  try {
    const rawParams = JSON.parse(event.body);

    await addEventsApi({ ...rawParams, ipAddress });

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
