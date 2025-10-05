import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";
import { cryptoV2 } from "../../lib/crypto-v2.js";
import { credentialsPrefix } from "../user-websites/user-websites.constants.js";

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const listApiKeysApi = async ({
  websiteId,
  userId,
}: {
  websiteId: string;
  userId: string;
}) => {
  const crypto = cryptoV2({ keyArn: apiConfig.kmsArn || "" });

  console.log(
    `=== Listing API keys for websiteId: ${websiteId}, userId: ${userId} ===`
  );

  const params = {
    TableName: tableNames.apiKeysTable,
    IndexName: "byWebsiteId",
    KeyConditionExpression: "websiteId = :websiteId",
    FilterExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":websiteId": websiteId,
      ":userId": userId,
    },
    ScanIndexForward: false, // Sort by descending order (newest first)
  };

  const result = await dynamodb.send(new QueryCommand(params));

  console.log(
    `=== Found ${result.Items?.length || 0} API keys for website ${websiteId} ===`
  );

  const itemsWithDecryptedKeys = await Promise.all(
    (result.Items || []).map(async (item) => {
      const { plaintext } = await crypto.decrypt(item?.apiKey);
      return {
        ...item,
        apiKey: `${credentialsPrefix}${item?.id}${plaintext}`,
      };
    })
  );

  return {
    apiKeys: itemsWithDecryptedKeys,
    count: result.Items?.length || 0,
  };
};
