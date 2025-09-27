const middy = require("@middy/core");
const cors = require("@middy/http-cors");
const { updateUserCredentialApi } = require("./update-user-credential.api");

module.exports.handler = middy(async (event) => {
  const { id, title, description, scopes, permissionType } = JSON.parse(
    event.body
  );

  const userId = event.requestContext.authorizer.claims.email;

  try {
    const userCredential = await updateUserCredentialApi({
      id,
      title,
      description,
      scopes,
      permissionType,
      userId,
    });

    if (!userCredential) {
      const response = {
        statusCode: 401,
        body: JSON.stringify({
          message: `User credential with id: ${id} does not exist.`,
        }),
      };
      return response;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify(userCredential),
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
