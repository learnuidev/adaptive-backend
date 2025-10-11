import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { z } from "zod";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";
import { Team } from "adaptive.fyi";

const client = new DynamoDBClient({
  region: apiConfig.region,
});
const docClient = DynamoDBDocumentClient.from(client);

export const CreateTeamRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type CreateTeamRequest = z.infer<typeof CreateTeamRequestSchema>;

export const createTeamApi = async (
  request: CreateTeamRequest,
  ownerUserId: string
): Promise<Team> => {
  const teamId = ulid();

  const team: Team = {
    id: teamId,
    name: request.name,
    description: request.description,
    ownerId: ownerUserId,
    memberCount: 1, // Owner counts as first member
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "ACTIVE",
  };

  // Create team record
  const teamParams = {
    TableName: tableNames.teamInvitationTable, // Reusing this table for now - should have separate teams table
    Item: {
      ...team,
      entityType: "TEAM", // Add type discriminator
    },
    ConditionExpression: "attribute_not_exists(id)",
  };

  await docClient.send(new PutCommand(teamParams));

  // Add owner as team member
  const memberParams = {
    TableName: tableNames.teamMembersTable,
    Item: {
      id: ulid(),
      userId: ownerUserId,
      websiteId: teamId, // Using websiteId as teamId for now
      role: "ADMIN",
      addedBy: ownerUserId,
      addedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: "ACTIVE",
    },
    ConditionExpression: "attribute_not_exists(id)",
  };

  await docClient.send(new PutCommand(memberParams));

  return team;
};
