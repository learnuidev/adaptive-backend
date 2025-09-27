// const {
//   getUserCredentialById,
// } = require("../user-credential/get-user-credential-by-id");

const {
  getUserCredentialById,
} = require("../../user-credentials/get-user-credential-by-id.api");

const withUserCredentialMiddleware = async (event, context, next) => {
  try {
    const userCredentialId =
      event?.requestContext?.authorizer?.userCredentialId;

    const unauthorizedResponse = {
      statusCode: 401,
      body: JSON.stringify({
        message:
          "Incorrect API key provided: YOUR_INVALID_KEY. You can find your API key at https://mandarino.io",
      }),
    };

    if (!userCredentialId) {
      return unauthorizedResponse;
    }

    const userCredential = await getUserCredentialById(userCredentialId);

    if (!userCredential) {
      return unauthorizedResponse;
    }

    event.userCredential = userCredential;

    return await next(event, context);
  } catch (error) {
    console.error("Error in userExistsMiddleware:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }
};

module.exports = { withUserCredentialMiddleware };
