// Middlewares
const middy = require("@middy/core");
const cors = require("@middy/http-cors");
const { deleteUserCredentialApi } = require("./delete-user-credential.api");

module.exports.handler = middy(async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.email;
    const { credentialId } = JSON.parse(event.body);

    const deletedCredential = await deleteUserCredentialApi({
      credentialId,
      userId,
    });

    if (!deletedCredential) {
      const response = {
        statusCode: 404,
        body: JSON.stringify({
          message: `Credential with id: ${credentialId} not found`,
        }),
      };
      return response;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: deletedCredential.message,
      }),
    };
    return response;
  } catch (error) {
    return {
      statusCode: error.stausCode,
      body: JSON.stringify({ error }),
    };
  }
}).use(cors());
