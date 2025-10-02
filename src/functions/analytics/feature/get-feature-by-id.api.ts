import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  QueryCommand,
  GetCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../../constants/api-config.js";
import { tableNames } from "../../../constants/table-names.js";

// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const getFeatureByIdApi = async (props: { id: string }) => {
  const { id } = props;

  const inputParams = {
    TableName: tableNames.featureTable,
    Key: {
      id,
    },
  };

  const { Item } = await dynamodb.send(new GetCommand(inputParams));

  return Item;
};
