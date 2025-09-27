const middy = require("@middy/core");
const cors = require("@middy/http-cors");

const { addUserCredentialApi } = require("./add-user-credential.api");

module.exports.handler = middy(async (event) => {
  const userId = event.requestContext.authorizer.claims.email;

  const { title, description, scopes, permissionType, ...rest } = JSON.parse(
    event.body
  );

  const userCredential = await addUserCredentialApi({
    title,
    description,
    scopes,
    permissionType,
    userId,
    ...rest,
  });

  const response = {
    statusCode: 201,
    body: JSON.stringify(userCredential),
  };
  return response;
}).use(cors());
