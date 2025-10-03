import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../../constants/api-config.js";
import { tableNames } from "../../../constants/table-names.js";

// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const getCohortById = async (props: { cohortId: string }) => {
  const { cohortId } = props;

  const inputParams = {
    TableName: tableNames.cohortTable,
    Key: {
      id: cohortId,
    },
  };

  const { Item } = await dynamodb.send(new GetCommand(inputParams));

  return Item;
};
