import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
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

// Zod schema for delete cohort input
export const deleteCohortSchema = z
  .object({
    id: z.ulid(),
    websiteId: z.ulid(),
  })
  .strict();

export const deleteCohortApi = async (props: unknown) => {
  const parsed = deleteCohortSchema.parse(props);

  const { id, websiteId } = parsed;

  const params = {
    TableName: tableNames.cohortTable,
    Key: {
      id,
      // websiteId,
    },
  };

  await dynamodb.send(new DeleteCommand(params));

  return { id, websiteId };
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
