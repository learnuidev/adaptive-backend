import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
});

const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const deleteUserWebsiteApi = async ({
  websiteId,
  userId,
}: {
  websiteId: string;
  userId: string;
}) => {
  // Get the item by website Id
  const getParams = {
    TableName: tableNames.userCredentialsTable,
    Key: { id: websiteId },
  };
  const resp = await dynamodb.send(new GetCommand(getParams));
  const credential = resp.Item;

  if (!credential) {
    return null;
  }

  if (credential.userId !== userId) {
    return null;
  }

  // Delete the item
  const deleteParams = {
    TableName: tableNames.userCredentialsTable,
    Key: { id: websiteId },
  };

  await dynamodb.send(new DeleteCommand(deleteParams));

  return {
    success: true,
    message: `Website with id: ${websiteId} deleted successfully`,
  };
};
