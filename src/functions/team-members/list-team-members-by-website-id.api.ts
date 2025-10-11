import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";
import { TeamMember } from "adaptive.fyi";

const ddbClient = new DynamoDBClient({ region: apiConfig.region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const ListTeamMembersByWebsiteIdRequestSchema = z.object({
  websiteId: z.ulid(),
});

export type ListTeamMembersByWebsiteIdRequest = z.infer<
  typeof ListTeamMembersByWebsiteIdRequestSchema
>;

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
