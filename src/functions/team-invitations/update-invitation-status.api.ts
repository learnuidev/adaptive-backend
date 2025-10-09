import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  createTeamMemberFromInvitation,
  isUserTeamMember,
  sendInvitationEmail,
  sendInvitationStatusUpdateEmail,
} from "./invitation-utils.js";
import { TeamInvitation, UpdateInvitationStatusRequest } from "adaptive.fyi";
import { InvitationStatus } from "./team-invitationts.types.js";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";

const client = new DynamoDBClient({
  region: apiConfig.region,
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = tableNames.teamInvitationTable;

export const updateInvitationStatusApi = async (
  request: UpdateInvitationStatusRequest,
  userEmail?: string
): Promise<TeamInvitation> => {
  // First, get the current invitation to validate
  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      id: request.invitationId,
    },
  };

  const getResult = await docClient.send(new GetCommand(getParams));

  if (!getResult.Item) {
    throw new Error("Invitation not found");
  }

  const currentInvitation = getResult.Item as TeamInvitation;

  // Validate that the user can update this invitation
  if (userEmail && currentInvitation.email !== userEmail.toLowerCase()) {
    throw new Error("You can only update your own invitations");
  }

  // Validate status transitions
  if (currentInvitation.status === InvitationStatus.ACCEPTED) {
    throw new Error("Invitation has already been accepted");
  }

  if (currentInvitation.status === InvitationStatus.REJECTED) {
    throw new Error("Invitation has already been rejected");
  }

  if (currentInvitation.status === InvitationStatus.EXPIRED) {
    throw new Error("Invitation has expired");
  }

  // Update the invitation
  const now = new Date().toISOString();
  const updateExpression = ["SET #status = :status", "#updatedAt = :updatedAt"];

  const expressionAttributeNames: any = {
    "#status": "status",
    "#updatedAt": "updatedAt",
  };

  const expressionAttributeValues: any = {
    ":status": request.status,
    ":updatedAt": now,
  };

  // Add acceptedAt timestamp if accepting
  if (request.status === InvitationStatus.ACCEPTED) {
    updateExpression.push("#acceptedAt = :acceptedAt");
    expressionAttributeNames["#acceptedAt"] = "acceptedAt";
    expressionAttributeValues[":acceptedAt"] = now;
  }

  const updateParams = {
    TableName: TABLE_NAME,
    Key: {
      id: request.invitationId,
    },
    UpdateExpression: updateExpression.join(", "),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW" as const,
  };

  const result = await docClient.send(new UpdateCommand(updateParams));
  const updatedInvitation = result.Attributes as TeamInvitation;

  // If invitation was accepted, create team member record
  if (request.status === InvitationStatus.ACCEPTED) {
    try {
      // Check if user is already a team member
      const isAlreadyMember = await isUserTeamMember(
        currentInvitation.email,
        currentInvitation.websiteId
      );

      if (!isAlreadyMember) {
        await createTeamMemberFromInvitation(updatedInvitation);
      }
    } catch (error) {
      console.error("Error creating team member from invitation:", error);
      // Don't fail the invitation update, but log the error
      // In production, you might want to retry this or handle it differently
    }
  }

  // Send status update email to the inviter
  if (
    request.status === InvitationStatus.ACCEPTED ||
    request.status === InvitationStatus.REJECTED
  ) {
    try {
      await sendInvitationStatusUpdateEmail(
        updatedInvitation,
        request.status === InvitationStatus.ACCEPTED ? "accepted" : "rejected"
      );
    } catch (error) {
      console.error("Error sending status update email:", error);
      // Don't fail the invitation update, but log the error
    }
  }

  return updatedInvitation;
};
