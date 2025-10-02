import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

import { apiConfig } from "../../../constants/api-config.js";
import { tableNames } from "../../../constants/table-names.js";
import { constructFeatureKeyAndWebsiteId } from "./utils.js";

// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

// Zod schema for getFeatureByFeatureKeyAndWebsiteId input
export const getFeatureByFeatureKeyAndWebsiteIdSchema = z.object({
  featureKey: z.string(),
  websiteId: z.ulid(),
});

export type GetFeatureByFeatureKeyAndWebsiteIdInput = z.infer<
  typeof getFeatureByFeatureKeyAndWebsiteIdSchema
>;

export const getFeatureByFeatureKeyAndWebsiteIdApi = async (
  props: GetFeatureByFeatureKeyAndWebsiteIdInput
) => {
  const parsed = getFeatureByFeatureKeyAndWebsiteIdSchema.parse(props);

  const { featureKey, websiteId } = parsed;

  const featureKeyAndWebsiteId = constructFeatureKeyAndWebsiteId(parsed);

  const params = {
    TableName: tableNames.featureTable,
    IndexName: "byFeatureKeyAndWebsiteId",
    KeyConditionExpression: "featureKeyAndWebsiteId = :featureKeyAndWebsiteId",
    ExpressionAttributeValues: {
      ":featureKeyAndWebsiteId": featureKeyAndWebsiteId,
    },
  };

  const { Items = [] } = await dynamodb.send(new QueryCommand(params));

  return Items[0] ?? null;
};
