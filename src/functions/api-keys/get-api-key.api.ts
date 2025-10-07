import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";
import { cryptoV2 } from "../../lib/crypto-v2.js";
import { credentialsPrefix } from "../user-websites/user-websites.constants.js";

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const getApiKeyApi = async ({
  id,
  // userId,
}: {
  id: string;
  // userId: string;
}) => {
  // console.log(`=== Getting API key with id: ${id}, userId: ${userId} ===`);

  const crypto = cryptoV2({ keyArn: apiConfig.kmsArn || "" });

  const params = {
    TableName: tableNames.apiKeysTable,
    Key: {
      id,
    },
  };

  const result = await dynamodb.send(new GetCommand(params));

  if (!result.Item) {
    console.log(`=== API key with id ${id} not found ===`);
    return null;
  }

  // Verify that the user owns this API key
  // if (result.Item.userId !== userId) {
  //   console.log(`=== User ${userId} does not own API key ${id} ===`);
  //   return null;
  // }

  console.log(`=== Successfully retrieved API key ${id} ===`);

  const apiKeyItem = result.Item;

  const { plaintext } = await crypto.decrypt(apiKeyItem?.apiKey);

  const apiKeyItemWithDecryptedKey = {
    ...apiKeyItem,
    apiKey: `${credentialsPrefix}${apiKeyItem?.id}${plaintext}`,
  };

  return apiKeyItemWithDecryptedKey;
};
