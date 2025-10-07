import { apiConfig } from "../../constants/api-config.js";
import {
  API_KEY_LENGTH,
  API_SECRET_LENGTH,
  cryptoV2,
} from "../../lib/crypto-v2.js";
import { getApiKeyApi } from "../api-keys/get-api-key.api.js";
import { getUserWebsiteById } from "../user-websites/get-user-website-by-id.api.js";
import { credentialsPrefix } from "../user-websites/user-websites.constants.js";

export async function validateApiKey(apiKeyWithMando: string) {
  // Implement your API key validation logic here
  // This could involve checking against a database or external service

  const crypto = cryptoV2({ keyArn: apiConfig.kmsArn || "" });

  const apiKeyIdAndKeyValue = apiKeyWithMando.split(credentialsPrefix)[1];

  const apiKeyId = apiKeyIdAndKeyValue.slice(0, API_KEY_LENGTH);
  const apiSecretParams = apiKeyIdAndKeyValue.slice(
    API_KEY_LENGTH,
    API_KEY_LENGTH + API_SECRET_LENGTH
  );

  const apiKeyItem = await getApiKeyApi({ id: apiKeyId });

  if (!apiKeyItem) {
    return false;
  }

  const { apiKey } = apiKeyItem;

  if (apiKey === apiKeyWithMando) {
    return apiKeyItem;
  }

  return false;
}

// yo
