import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

// Zod schema for listFeatureVersionsByFeatureId input
export const listFeatureVersionsByFeatureIdSchema = z.object({
  featureId: z.ulid(),
});

export type ListFeatureVersionsByFeatureIdInput = z.infer<
  typeof listFeatureVersionsByFeatureIdSchema
>;

export const listFeatureVersionsByFeatureIdApi = async (
  props: ListFeatureVersionsByFeatureIdInput
) => {
  const parsed = listFeatureVersionsByFeatureIdSchema.parse(props);

  const { featureId } = parsed;

  const params = {
    TableName: tableNames.featureVersionTable,
    IndexName: "byFeatureId", // Assumes a GSI with partition key featureId
    KeyConditionExpression: "featureId = :featureId",
    ExpressionAttributeValues: {
      ":featureId": featureId,
    },
  };

  const { Items = [] } = await dynamodb.send(new QueryCommand(params));

  return Items;
};

// ### FeatureVersion & Rollout

// Each feature can have multiple versions; one is marked as `active`.
// A version’s rollout defines how it is gradually released to users.

// | Field             | Type     | Description                                                                                |
// | ----------------- | -------- | ------------------------------------------------------------------------------------------ |
// | id                | UUID     | Unique identifier for the version                                                          |
// | featureId         | UUID     | Parent feature ID                                                                          |
// | version           | String   | Semantic version string (e.g., 1.2.3)                                                      |
// | config            | JSON     | Arbitrary payload delivered to clients when version is active                              |
// | isActive          | Boolean  | Whether this version is currently served to users                                          |
// | rolloutPercentage | Integer  | 0–100; percentage of users who receive this version (null until rollout is created)        |
// | rolloutRules      | JSON[]   | Optional audience targeting rules that override the percentage (null until rollout exists) |
// | createdAt         | DateTime | Timestamp of version creation                                                              |
// | createdBy         | UUID     | ID of the user who created the version                                                     |
// | updatedAt         | DateTime | Timestamp of last update                                                                   |
// | updatedBy         | UUID     | ID of the user who last updated the version                                                |
