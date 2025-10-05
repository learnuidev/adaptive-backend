import { apiConfig } from "../../constants/api-config.js";
import {
  API_KEY_LENGTH,
  API_SECRET_LENGTH,
  cryptoV2,
} from "../../lib/crypto-v2.js";
import { getUserWebsiteById } from "../user-websites/get-user-website-by-id.api.js";
import { credentialsPrefix } from "../user-websites/user-websites.constants.js";

export async function validateApiKey(apiKeyWithMando: string) {
  // Implement your API key validation logic here
  // This could involve checking against a database or external service

  const crypto = cryptoV2({ keyArn: apiConfig.kmsArn || "" });

  const apiKey = apiKeyWithMando.split(credentialsPrefix)[1];

  const userCredentialId = apiKey.slice(0, API_KEY_LENGTH);
  const apiSecretParams = apiKey.slice(
    API_KEY_LENGTH,
    API_KEY_LENGTH + API_SECRET_LENGTH
  );

  const userWebsite = await getUserWebsiteById(userCredentialId);

  if (!userWebsite) {
    return false;
  }

  const { apiSecret } = userWebsite;
  const { plaintext } = await crypto.decrypt(apiSecret);

  if (`${plaintext}` === apiSecretParams) {
    return userWebsite;
  }

  return false;
}

// yo
