import { generatePolicy } from "./generate-policy.mjs";
import { validateApiKey } from "./validate-api-key.mjs";

export const handler = async (event) => {
  const token = event.authorizationToken;
  const websiteId = JSON.parse(event.body)?.websiteId;

  if (!token || !token.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const apiKey = token.split(" ")[1];

  const credentials = await validateApiKey(apiKey);

  if (credentials) {
    return generatePolicy("user", "Allow", event.methodArn, credentials);
  } else {
    throw new Error("Unauthorized");
  }
};
