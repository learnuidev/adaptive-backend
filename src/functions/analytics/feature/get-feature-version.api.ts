import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

import { apiConfig } from "../../../constants/api-config.js";
import { tableNames } from "../../../constants/table-names.js";

// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

// Zod schema for getFeatureVersionById input
export const getFeatureVersionByIdSchema = z.object({
  id: z.ulid(),
});

export type GetFeatureVersionByIdInput = z.infer<
  typeof getFeatureVersionByIdSchema
>;
export const getFeatureVersionApi = async (
  props: GetFeatureVersionByIdInput
) => {
  const parsed = getFeatureVersionByIdSchema.parse(props);

  const { id } = parsed;

  const params = {
    TableName: tableNames.featureVersionTable,
    Key: { id },
  };

  const { Item } = await dynamodb.send(new GetCommand(params));

  return Item;
};
