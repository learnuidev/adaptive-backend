import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { z } from "zod";

import { removeNull } from "../../../utils/remove-null.js";
import { apiConfig } from "../../../constants/api-config.js";
import { tableNames } from "../../../constants/table-names.js";

const addFeatureSchema = z.object({
  name: z.string().min(1),
  featureKey: z.string().min(1),
  description: z.string().optional(),
  userId: z.string().email(),
  tags: z.array(z.string()).optional(),
  websiteId: z.ulid(),
  featureKeyAndWebsiteId: z.string().min(1),
});

export type AddFeatureInput = z.infer<typeof addFeatureSchema>;

export type Feature = AddFeatureInput & {
  id: string;
  createdAt: number;
};
// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const addFeatureApi = async (props: any) => {
  const id = ulid();

  const params = removeNull({ id, ...props, createdAt: Date.now() });

  const inputParams = {
    TableName: tableNames.featureTable,
    Item: params,
  };

  // Equivalent to .put(...).promise()
  await dynamodb.send(new PutCommand(inputParams));

  return params;
};
