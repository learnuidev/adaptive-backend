const middy = require("@middy/core");
const cors = require("@middy/http-cors");
const { listUserCredentialsApi } = require("./list-user-credentials.api");

const baseHandler = async (event) => {
  const userEmail = event.requestContext.authorizer.claims.email;
  const credentials = await listUserCredentialsApi(userEmail);

  return {
    statusCode: 200,
    body: JSON.stringify(credentials),
  };
};

module.exports.handler = middy(baseHandler).use(cors());
