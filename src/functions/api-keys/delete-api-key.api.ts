import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const deleteApiKeyApi = async ({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) => {
  console.log(`=== Deleting API key with id: ${id}, userId: ${userId} ===`);

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

  // Delete the API key
  const deleteParams = {
    TableName: tableNames.apiKeysTable,
    Key: {
      id,
    },
  };

  await dynamodb.send(new DeleteCommand(deleteParams));

  console.log(`=== Successfully deleted API key ${id} ===`);

  return getResult.Item;
};
