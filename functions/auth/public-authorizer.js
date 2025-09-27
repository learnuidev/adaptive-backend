const {
  getUserCredentialById,
} = require("../user-credentials/get-user-credential-by-id.api");
const { generatePolicy } = require("./generate-policy");

exports.handler = async (event) => {
  const websiteId = JSON.parse(event.body)?.websiteId;

  if (!websiteId) {
    throw new Error("Unauthorized");
  }

  const userCredential = await getUserCredentialById(websiteId);

  if (!userCredential) {
    throw new Error("Unauthorized");
  }

  // Extract userRequestDomain from event headers, e.g. Host header
  const userRequestDomain = event.headers?.Host || event.headers?.host;

  if (!userRequestDomain) {
    throw new Error("Unauthorized");
  }

  if (userCredential.domains) {
    if (userCredential?.domains?.includes(userRequestDomain)) {
      return generatePolicy("user", "Allow", event.methodArn, userCredential);
    } else {
      throw new Error("Unauthorized");
    }
  }

  if (userRequestDomain !== userCredential.domain) {
    throw new Error("Unauthorized");
  }

  if (userCredential) {
    return generatePolicy("user", "Allow", event.methodArn, userCredential);
  } else {
    throw new Error("Unauthorized");
  }
};
