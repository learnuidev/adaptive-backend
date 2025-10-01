import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { z } from "zod";

import { removeNull } from "../../../utils/remove-null.js";
import { apiConfig } from "../../../constants/api-config.js";
import { tableNames } from "../../../constants/table-names.js";

// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

// Zod schema for FeatureVersion
const addFeatureVersionSchema = z
  .object({
    featureId: z.string().uuid(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, {
      message: "Must be a semantic version (e.g., 1.2.3)",
    }),
    config: z.record(z.string(), z.unknown()),
    isActive: z.boolean().default(false),
    rolloutPercentage: z.number().int().min(0).max(100).nullable().optional(),
    rolloutRules: z
      .array(z.record(z.string(), z.unknown()))
      .nullable()
      .optional(),
    createdBy: z.string().uuid(),
  })
  .strict();

export const addFeatureVersionApi = async (props: unknown) => {
  const parsed = addFeatureVersionSchema.parse(props);

  const id = ulid();
  const now = Date.now();

  const params = removeNull({
    id,
    ...parsed,
    createdAt: now,
    updatedAt: now,
    updatedBy: parsed.createdBy,
  });

  const inputParams = {
    TableName: tableNames.featureVersionTable,
    Item: params,
  };

  await dynamodb.send(new PutCommand(inputParams));

  return params;
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
