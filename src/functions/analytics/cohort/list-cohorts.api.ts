import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { apiConfig } from "../../../constants/api-config.js";
import { tableNames } from "../../../constants/table-names.js";

// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const listCohortsApi = async (props: { websiteId: string }) => {
  const { websiteId } = props;

  const inputParams = {
    TableName: tableNames.cohortTable,
    IndexName: "byWebsiteId",
    KeyConditionExpression: "websiteId = :websiteId",
    ExpressionAttributeValues: {
      ":websiteId": websiteId,
    },
  };

  const { Items = [] } = await dynamodb.send(new QueryCommand(inputParams));

  return Items;
};
