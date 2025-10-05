import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  UpdateCommand,
  GetCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";
import { removeNull } from "../../utils/remove-null.js";

import { cryptoV2, generateApiSecret } from "../../lib/crypto-v2.js";
import { credentialsPrefix } from "../user-websites/user-websites.constants.js";

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const rotateApiKeyApi = async ({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) => {
  console.log(`=== Rotating API key with id: ${id}, userId: ${userId} ===`);

  // First, verify the user owns this API key by getting it
  const getParams = {
    TableName: tableNames.apiKeysTable,
    Key: {
      id,
    },
  };

  const getResult = await dynamodb.send(new GetCommand(getParams));

  if (!getResult.Item) {
    console.log(`=== API key with id ${id} not found ===`);
    return null;
  }

  // Verify that the user owns this API key
  if (getResult.Item.userId !== userId) {
    console.log(`=== User ${userId} does not own API key ${id} ===`);
    return null;
  }

  // Generate new API secret
  const crypto = cryptoV2({ keyArn: apiConfig.kmsArn || "" });
  const newApiSecret = generateApiSecret();
  const { result: encryptedApiSecret } = await crypto.encrypt(newApiSecret);

  const updatedAt = Date.now();
  const prefix = id.slice(0, 3);
  const suffix = newApiSecret.slice(-4);

  const updateParams = {
    TableName: tableNames.apiKeysTable,
    Key: {
      id,
    },
    UpdateExpression:
      "SET apiKey = :apiKey, previewApiKey = :previewApiKey, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":apiKey": encryptedApiSecret,
      ":previewApiKey": `${credentialsPrefix}${prefix}...${suffix}`,
      ":updatedAt": updatedAt,
    },
    ReturnValues: "ALL_NEW" as const,
  };

  const updateResult = await dynamodb.send(new UpdateCommand(updateParams));

  console.log(`=== Successfully rotated API key ${id} ===`);

  // Return the new API secret (only time it's shown)
  return {
    ...updateResult.Attributes,
    apiKey: `${credentialsPrefix}${id}${newApiSecret}`,
  };
};
