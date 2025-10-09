import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";
import { cryptoV2 } from "../../lib/crypto-v2.js";
import { credentialsPrefix } from "./user-websites.constants.js";

const ddbClient = new DynamoDBClient({ region: apiConfig.region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const listUserWebsitesApi = async (userId: string) => {
  const params = {
    TableName: tableNames.userCredentialsTable,
    IndexName: "byUserId",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  const crypto = cryptoV2({ keyArn: apiConfig.kmsArn || "" });

  const resp = await dynamodb.send(new QueryCommand(params));

  const items = resp?.Items;

  if (!items) {
    return [];
  }

  return items;
};
