import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";

const ddbClient = new DynamoDBClient({ region: apiConfig.region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const ListTeamMembersByWebsiteIdRequestSchema = z.object({
  websiteId: z.ulid(),
});

export type ListTeamMembersByWebsiteIdRequest = z.infer<
  typeof ListTeamMembersByWebsiteIdRequestSchema
>;

export const TeamMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().optional(),
  websiteId: z.string(),
  role: z.string(),
  addedBy: z.string(),
  addedAt: z.string(),
  lastActiveAt: z.string(),
  status: z.string(),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const listTeamMembersByWebsiteIdApi = async (
  request: ListTeamMembersByWebsiteIdRequest
): Promise<TeamMember[]> => {
  const params = {
    TableName: tableNames.teamMembersTable,
    IndexName: "by-website",
    KeyConditionExpression: "websiteId = :websiteId",
    ExpressionAttributeValues: {
      ":websiteId": request.websiteId,
    },
  };

  const response = await dynamodb.send(new QueryCommand(params));
  return (response.Items || []) as TeamMember[];
};
