import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";
import { removeNull } from "../../utils/remove-null.js";

import { cryptoV2, generateApiSecret } from "../../lib/crypto-v2.js";
import { ulid } from "ulid";
import { credentialsPrefix } from "../user-websites/user-websites.constants.js";

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const createApiKeyApi = async ({
  websiteId,
  userId,
  ...rest
}: {
  apiKey: string;
  websiteId: string;
  userId: string;
}) => {
  console.log(
    `=== Creating API key for websiteId: ${websiteId}, userId: ${userId} ===`
  );

  const crypto = cryptoV2({ keyArn: apiConfig.kmsArn || "" });
  const apiSecret = generateApiSecret();
  const { result } = await crypto.encrypt(apiSecret);

  console.log(`Successfully encrypted API secret for website: ${websiteId}`);

  const createdAt = Date.now();
  const updatedAt = createdAt;

  const id = ulid();

  const prefix = id.slice(0, 3);
  const suffix = apiSecret.slice(-4);

  const apiKeyParams = {
    ...rest,
    id,
    apiKey: result, // Store encrypted API key
    websiteId,
    userId,
    previewApiKey: `${credentialsPrefix}${prefix}...${suffix}`,
    createdAt,
    updatedAt,
  };

  const params = {
    TableName: tableNames.apiKeysTable,
    Item: removeNull(apiKeyParams),
  };

  // Call DynamoDB to add the API key
  await dynamodb.send(new PutCommand(params));

  console.log(`=== Successfully created API key for website ${websiteId} ===`);

  // Return the API secret (only time it's shown)
  const response = {
    ...apiKeyParams,
    apiSecret: `${credentialsPrefix}${id}${apiSecret}`,
  };

  return response;
};
