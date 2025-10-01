import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../../constants/api-config.js";
import { tableNames } from "../../../constants/table-names.js";

// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const removeFeatureApi = async (id: string) => {
  const inputParams = {
    TableName: tableNames.featureTable,
    Key: { id },
  };

  await dynamodb.send(new DeleteCommand(inputParams));

  return { id };
};
