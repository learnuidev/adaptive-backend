import { apiConfig } from "../../constants/api-config";
import { cryptoV2 } from "../../lib/crypto-v2";
import { getUserCredentialById } from "../user-credentials/get-user-credential-by-id.api";
import { credentialsPrefix } from "../user-credentials/user-credentials.constants";
// import { getUserCredentialById } from "./user-credential/get-user-credential-by-id";

export async function validateApiKey(apiKeyWithMando) {
  // Implement your API key validation logic here
  // This could involve checking against a database or external service

  const crypto = cryptoV2({ keyArn: apiConfig.kmsKeyArn });

  const apiKey = apiKeyWithMando.split(credentialsPrefix)[1];

  const userCredentialId = apiKey.slice(0, 44);
  const apiSecretParams = apiKey.slice(44, 108);

  const userCredential = await getUserCredentialById(userCredentialId);

  if (!userCredential) {
    return false;
  }

  const { apiSecret } = userCredential;
  const { plaintext } = await crypto.decrypt(apiSecret);

  if (`${plaintext}` === apiSecretParams) {
    return userCredential;
  }

  return false;
}

// yo
