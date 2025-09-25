const middy = require("@middy/core");
const cors = require("@middy/http-cors");

const { addFeatureFlagsApi } = require("./add-feature-flag.api");

module.exports.handler = middy(async (event) => {
  try {
    const rawParams = JSON.parse(event.body);

    const newFeatureFlag = await addFeatureFlagsApi({
      ...rawParams,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify(newFeatureFlag),
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
