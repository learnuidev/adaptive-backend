import { z } from "zod";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { tableNames } from "../../../constants/table-names.js";
import { apiConfig } from "../../../constants/api-config.js";
import { Note } from "./add-note.api.js";

const ListNotesInputSchema = z.object({
  websiteId: z.string(),
});

export type ListNotesInput = z.infer<typeof ListNotesInputSchema>;

export const listNotesByWebsiteId = async (
  props: ListNotesInput
): Promise<Note[]> => {
  const validated = ListNotesInputSchema.parse(props);

  // Create low-level DynamoDB client
  const ddbClient = new DynamoDBClient({
    region: apiConfig.region,
    apiVersion: "2012-08-10",
  });

  // Create high-level DocumentClient wrapper
  const dynamodb = DynamoDBDocumentClient.from(ddbClient);

  const params = {
    TableName: tableNames.notesTable,
    IndexName: "byWebsiteId",
    KeyConditionExpression: "websiteId = :websiteId",
    ExpressionAttributeValues: {
      ":websiteId": validated.websiteId,
    },
  };

  const { Items = [] } = await dynamodb.send(new QueryCommand(params));

  return Items as Note[];
};
