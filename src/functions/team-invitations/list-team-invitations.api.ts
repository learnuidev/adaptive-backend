import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ListInvitationsQuery, TeamInvitation } from "adaptive.fyi";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";

const client = new DynamoDBClient({
  region: apiConfig.region,
});
const docClient = DynamoDBDocumentClient.from(client);

export const listTeamInvitationsApi = async (
  query: ListInvitationsQuery
): Promise<{
  invitations: TeamInvitation[];
  total: number;
}> => {
  let invitations: TeamInvitation[] = [];
  let total = 0;

  try {
    if (query.websiteId) {
      // Query by website ID
      const params: any = {
        TableName: tableNames.teamInvitationTable,
        IndexName: "by-website",
        KeyConditionExpression: "websiteId = :websiteId",
      };

      if (query.status) {
        params.FilterExpression = "#status = :status";
        params.ExpressionAttributeNames = { "#status": "status" };
        params.ExpressionAttributeValues = {
          ":websiteId": query.websiteId,
          ":status": query.status,
        };
      } else {
        params.ExpressionAttributeValues = {
          ":websiteId": query.websiteId,
        };
      }

      const result = await docClient.send(new QueryCommand(params));
      invitations = (result.Items as TeamInvitation[]) || [];
      total = result.Count || 0;
    } else if (query.email) {
      // Query by email
      const params: any = {
        TableName: tableNames.teamInvitationTable,
        IndexName: "by-email",
        KeyConditionExpression: "email = :email",
      };

      if (query.status) {
        params.FilterExpression = "#status = :status";
        params.ExpressionAttributeNames = { "#status": "status" };
        params.ExpressionAttributeValues = {
          ":email": query.email.toLowerCase(),
          ":status": query.status,
        };
      } else {
        params.ExpressionAttributeValues = {
          ":email": query.email.toLowerCase(),
        };
      }

      const result = await docClient.send(new QueryCommand(params));
      invitations = (result.Items as TeamInvitation[]) || [];
      total = result.Count || 0;
    } else {
      // Scan all invitations (with filters if provided)
      const params: any = {
        TableName: tableNames.teamInvitationTable,
        FilterExpression: query.status ? "#status = :status" : undefined,
        ExpressionAttributeNames: query.status
          ? { "#status": "status" }
          : undefined,
        ExpressionAttributeValues: query.status
          ? { ":status": query.status }
          : undefined,
      };

      const result = await docClient.send(new ScanCommand(params));
      invitations = (result.Items as TeamInvitation[]) || [];
      total = result.Count || 0;
    }

    // Apply pagination
    const startIndex = query.offset || 0;
    const endIndex = startIndex + (query.limit || 0);
    const paginatedInvitations = invitations.slice(startIndex, endIndex);

    return {
      invitations: paginatedInvitations,
      total,
    };
  } catch (error) {
    console.error("Error listing team invitations:", error);
    throw error;
  }
};
