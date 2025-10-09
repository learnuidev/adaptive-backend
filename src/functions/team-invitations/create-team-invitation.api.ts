import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { addDays } from "date-fns";

import { sendInvitationEmail } from "./invitation-utils.js";
import { CreateInvitationRequest, TeamInvitation } from "adaptive.fyi";
import { InvitationStatus } from "./team-invitationts.types.js";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";

const client = new DynamoDBClient({
  region: apiConfig.region,
});
const docClient = DynamoDBDocumentClient.from(client);

// const TABLE_NAME = tableNames.teamInvitationTable;

export const createTeamInvitationApi = async (
  request: CreateInvitationRequest
): Promise<TeamInvitation> => {
  const invitation: TeamInvitation = {
    id: ulid(),
    email: request.email.toLowerCase(),
    websiteId: request.websiteId,
    role: request.role,
    status: InvitationStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: addDays(new Date(), 7).toISOString(), // Expire in 7 days
    message: request.message,
    invitedBy: "system", // This should be extracted from auth context
  };

  // Check if there's already a pending invitation for this email and website
  // Note: This check would require a GSI (Global Secondary Index) on email+websiteId
  // For now, we'll skip this check to avoid DynamoDB query complexity
  // In production, you should implement this check with a proper GSI

  const params = {
    TableName: tableNames.teamInvitationTable,
    Item: invitation,
    ConditionExpression: "attribute_not_exists(id)", // Prevent overwriting existing invitations
  };

  try {
    await docClient.send(new PutCommand(params));

    // Send invitation email
    try {
      await sendInvitationEmail(invitation);
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the invitation creation, but log the error
      // In production, you might want to retry this or handle it differently
    }

    return invitation;
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new Error("Invitation with this ID already exists");
    }
    throw error;
  }
};
