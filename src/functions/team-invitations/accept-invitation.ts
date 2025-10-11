import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { verifyInvitationToken } from "./create-team-invitation.api.js";
import { createTeamMemberFromInvitation } from "./invitation-utils.js";
import { sendInvitationStatusUpdateEmail } from "./invitation-utils.js";

import middy from "@middy/core";
import httpCors from "@middy/http-cors";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";

const client = new DynamoDBClient({
  region: apiConfig.region,
});
const docClient = DynamoDBDocumentClient.from(client);

interface AcceptInvitationRequest {
  token: string;
}

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: "Request body is required",
          }),
        };
      }

      // Extract user info from Cognito authorizer context
      const userClaims = event.requestContext?.authorizer?.claims;
      if (!userClaims) {
        return {
          statusCode: 401,
          body: JSON.stringify({
            success: false,
            error: "User authentication required",
          }),
        };
      }

      const userEmail = userClaims.email;
      const userId = userClaims.sub; // Cognito User ID

      const body: AcceptInvitationRequest = JSON.parse(event.body);
      const { token } = body;

      if (!token) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: "Invitation token is required",
          }),
        };
      }

      // Verify the token
      const verification = verifyInvitationToken(token);
      if (!verification.valid || !verification.data) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: verification.error || "Invalid or expired invitation token",
          }),
        };
      }

      const { invitationId, email, websiteId } = verification.data;

      // Verify that the authenticated user's email matches the invitation email
      if (userEmail?.toLowerCase() !== email?.toLowerCase()) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            success: false,
            userEmail: userEmail?.toLowerCase(),
            email: email?.toLowerCase(),
            error: "This invitation is not for your email address",
          }),
        };
      }

      // Fetch the invitation from DynamoDB
      const invitationParams = {
        TableName: tableNames.teamInvitationTable,
        Key: { id: invitationId },
      };

      const invitationResult = await docClient.send(
        new GetCommand(invitationParams)
      );
      const invitation = invitationResult.Item;

      if (!invitation) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            error: "Invitation not found",
          }),
        };
      }

      // Check if invitation is still pending
      if (invitation.status !== "PENDING") {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: `Invitation is ${invitation.status.toLowerCase()}`,
          }),
        };
      }

      // Check if invitation has expired
      if (new Date() > new Date(invitation.expiresAt)) {
        // Update invitation status to expired
        await docClient.send(
          new UpdateCommand({
            TableName: tableNames.teamInvitationTable,
            Key: { id: invitationId },
            UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
            ExpressionAttributeNames: {
              "#status": "status",
              "#updatedAt": "updatedAt",
            },
            ExpressionAttributeValues: {
              ":status": "EXPIRED",
              ":updatedAt": new Date().toISOString(),
            },
          })
        );

        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: "Invitation has expired",
          }),
        };
      }

      // Check if user is already a team member
      const existingMemberParams = {
        TableName: tableNames.teamMembersTable,
        IndexName: "by-email",
        KeyConditionExpression: "email = :email AND id = :id",
        ExpressionAttributeValues: {
          ":email": userEmail.toLowerCase(),
          ":id": websiteId,
        },
        Limit: 1,
      };

      const existingMemberResult = await docClient.send(
        new QueryCommand(existingMemberParams)
      );
      if (existingMemberResult.Items && existingMemberResult.Items.length > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: "You are already a member of this team",
          }),
        };
      }

      // Create team member from invitation
      const teamMember = await createTeamMemberFromInvitation({
        ...invitation,
        email: userEmail,
        acceptedBy: userId,
      });

      // Update invitation status to accepted
      await docClient.send(
        new UpdateCommand({
          TableName: tableNames.teamInvitationTable,
          Key: { id: invitationId },
          UpdateExpression:
            "SET #status = :status, #acceptedAt = :acceptedAt, #acceptedBy = :acceptedBy, #updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
            "#acceptedAt": "acceptedAt",
            "#acceptedBy": "acceptedBy",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":status": "ACCEPTED",
            ":acceptedAt": new Date().toISOString(),
            ":acceptedBy": userId,
            ":updatedAt": new Date().toISOString(),
          },
        })
      );

      // Send status update email to inviter
      try {
        await sendInvitationStatusUpdateEmail(invitation, "accepted");
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't fail the acceptance, just log the error
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            message: "Successfully joined the team",
            teamMember: {
              id: teamMember.id,
              websiteId: teamMember.websiteId,
              role: teamMember.role,
              addedAt: teamMember.addedAt,
            },
          },
        }),
      };
    } catch (error: any) {
      console.error("Error accepting invitation:", error);

      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: "Failed to accept invitation",
          message: error.message,
        }),
      };
    }
  }
).use(httpCors());
