const { apiConfig } = require("../../constants/api-config");
const { cryptoV2 } = require("../../lib/crypto-v2");
const {
  credentialsPrefix,
} = require("../user-credentials/user-credentials.constants");
const {
  getUserCredentialById,
} = require("./user-credential/get-user-credential-by-id");

async function validateApiKey(apiKeyWithMando) {
  // Implement your API key validation logic here
  // This could involve checking against a database or external service

  const crypto = cryptoV2({ keyArn: apiConfig.kmsKeyArn });

  const apiKey = apiKeyWithMando.split(credentialsPrefix)[1];

  const userCredentialId = apiKey.slice(0, 44);
  const apiSecretParams = apiKey.slice(44, 108);

  const userCredential = await getUserCredentialById(userCredentialId);

  console.log("USER CREDENTIAL", userCredential);

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

module.exports = {
  validateApiKey,
};
