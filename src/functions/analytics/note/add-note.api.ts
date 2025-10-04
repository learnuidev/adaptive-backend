import { z } from "zod";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

import { removeNull } from "../../../utils/remove-null.js";
import { tableNames } from "../../../constants/table-names.js";
import { apiConfig } from "../../../constants/api-config.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";

const AddNoteInputSchema = z.object({
  userId: z.string(),
  websiteId: z.string(),
  text: z.string(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type AddNoteInput = z.infer<typeof AddNoteInputSchema>;

export type Note = AddNoteInput & {
  id: string;
};

export const addNoteApi = async (props: AddNoteInput): Promise<Note> => {
  const validated = AddNoteInputSchema.parse(props);

  // Create low-level DynamoDB client
  const ddbClient = new DynamoDBClient({
    region: apiConfig.region,
    apiVersion: "2012-08-10",
  });

  // Create high-level DocumentClient wrapper
  const dynamodb = DynamoDBDocumentClient.from(ddbClient);

  const id = ulid();
  const params = removeNull({
    id,
    ...validated,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const inputParams = {
    TableName: tableNames.notesTable,
    Item: params,
  };

  // Use `PutCommand` from @aws-sdk/lib-dynamodb
  await dynamodb.send(new PutCommand(inputParams));

  if (clickhouseClient) {
    await clickhouseClient.ingestDDBEvent(clickhouseClient.client, params);
  }

  return params as Note;
};
