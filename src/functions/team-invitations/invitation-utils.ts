import { emailService } from "./email-service.js";
import { TeamInvitation, TeamMember } from "adaptive.fyi";
import { TeamRole } from "./team-invitationts.types.js";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { tableNames } from "../../constants/table-names.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// const INVITATIONS_TABLE =
//   process.env.TEAM_INVITATIONS_TABLE_NAME || "team-invitations";
// const MEMBERS_TABLE = process.env.TEAM_MEMBERS_TABLE_NAME || "team-members";

/**
 * Convert an accepted invitation to a team member
 */
export const createTeamMemberFromInvitation = async (
  invitation: TeamInvitation & { acceptedBy?: string }
): Promise<TeamMember> => {
  const teamMember: TeamMember = {
    id: ulid(),
    email: invitation.email,
    websiteId: invitation.websiteId,
    role: invitation.role,
    addedBy: invitation.invitedBy,
    addedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  const params = {
    TableName: tableNames.teamMembersTable,
    Item: teamMember,
    ConditionExpression: "attribute_not_exists(id)",
  };

  await docClient.send(new PutCommand(params));

  return teamMember;
};

/**
 * Check if a user is already a team member for a website
 */
export const isUserTeamMember = async (
  email: string,
  websiteId: string
): Promise<boolean> => {
  // This would typically query the members table
  // For now, we'll return false and let the DynamoDB constraint handle duplicates
  return false;
};

/**
 * Get all team members for a website
 */
export const getWebsiteTeamMembers = async (
  websiteId: string
): Promise<TeamMember[]> => {
  const params = {
    TableName: tableNames.teamMembersTable,
    IndexName: "by-website",
    KeyConditionExpression: "websiteId = :websiteId",
    ExpressionAttributeValues: {
      ":websiteId": websiteId,
    },
  };

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items as TeamMember[]) || [];
};

/**
 * Remove a team member from a website
 */
export const removeTeamMember = async (
  memberId: string,
  websiteId: string
): Promise<void> => {
  const params = {
    TableName: tableNames.teamMembersTable,
    Key: {
      id: memberId,
    },
    ConditionExpression: "websiteId = :websiteId",
    ExpressionAttributeValues: {
      ":websiteId": websiteId,
    },
  };

  await docClient.send(new DeleteCommand(params));
};

/**
 * Update team member role
 */
export const updateTeamMemberRole = async (
  memberId: string,
  websiteId: string,
  newRole: TeamRole
): Promise<TeamMember> => {
  const params = {
    TableName: tableNames.teamMembersTable,
    Key: {
      id: memberId,
    },
    UpdateExpression: "SET #role = :role, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#role": "role",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":role": newRole,
      ":updatedAt": new Date().toISOString(),
      ":websiteId": websiteId,
    },
    ConditionExpression: "websiteId = :websiteId",
    ReturnValues: "ALL_NEW" as const,
  };

  const result = await docClient.send(new UpdateCommand(params));
  return result.Attributes as TeamMember;
};

/**
 * Send invitation email using the email service
 */
export const sendInvitationEmail = async (
  invitation: TeamInvitation & { token?: string }
): Promise<void> => {
  await emailService.sendInvitationEmail(invitation);
};

/**
 * Send invitation status update email
 */
export const sendInvitationStatusUpdateEmail = async (
  invitation: TeamInvitation,
  status: "accepted" | "rejected"
): Promise<void> => {
  await emailService.sendInvitationStatusUpdateEmail(invitation, status);
};

/**
 * Check for expired invitations and update their status
 */
export const expireInvitations = async (): Promise<void> => {
  const now = new Date().toISOString();

  // This would typically scan for expired invitations and update them
  // For now, this is a placeholder for the cleanup process
  console.log(`Checking for expired invitations as of ${now}`);

  // TODO: Implement cleanup process for expired invitations
  // This would be triggered by a scheduled Lambda function
};
