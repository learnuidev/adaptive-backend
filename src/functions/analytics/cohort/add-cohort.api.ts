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

// Zod schema for Cohort
export const addCohortSchema = z
  .object({
    websiteId: z.ulid(),
    name: z.string().min(1),
    cohortRules: z
      .array(z.record(z.string(), z.unknown()))
      .nullable()
      .optional(),
  })
  .strict();

export const addCohortApi = async (props: unknown) => {
  const parsed = addCohortSchema.parse(props);

  const id = ulid();
  const now = Date.now();

  const params = removeNull({
    id,
    ...parsed,
    createdAt: now,
    updatedAt: now,
  });

  const inputParams = {
    TableName: tableNames.cohortTable,
    Item: params,
  };

  await dynamodb.send(new PutCommand(inputParams));

  return params;
};

// ### Cohort

// | Field             | Type     | Description                                                                                |
// | ----------------- | -------- | ------------------------------------------------------------------------------------------ |
// | id                | UUID     | Unique identifier for the version                                                          |
// | websiteId         | UUID     | Parent website ID                                                                          |
// | name              | String   | Cohort name (e.g., "power-users")                                                        |
// | version           | String   | Semantic version string (e.g., 1.2.3)                                                      |
// | cohortRules      | JSON[]   | Optional audience targeting rules that override the percentage (null until rollout exists) |
// | createdAt         | DateTime | Timestamp of version creation                                                              |
// | createdBy         | UUID     | ID of the user who created the version                                                     |
// | updatedAt         | DateTime | Timestamp of last update                                                                   |
// | updatedBy         | UUID     | ID of the user who last updated the version                                                |
