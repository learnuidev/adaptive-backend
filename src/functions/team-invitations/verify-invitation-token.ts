import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { verifyInvitationToken } from "./create-team-invitation.api.js";

import middy from "@middy/core";
import httpCors from "@middy/http-cors";
import { updateInvitationStatusApi } from "./update-invitation-status.api.js";
import { InvitationStatus } from "./team-invitationts.types.js";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            valid: false,
            error: "Request body is required",
          }),
        };
      }

      const body = JSON.parse(event.body);
      const { token } = body;

      if (!token) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            valid: false,
            error: "Token is required",
          }),
        };
      }

      // Verify the token
      const verification = verifyInvitationToken(token);

      if (!verification.valid) {
        return {
          statusCode: 400,
          body: JSON.stringify(verification),
        };
      }

      // Token is valid, now fetch the invitation details from DynamoDB
      // For now, return the basic verification data
      // In a full implementation, you'd query the invitation table to get full details

      const userEmail = verification?.data?.email;
      const data = {
        ...verification?.data,
        status: InvitationStatus.ACCEPTED,
      };

      const updatedInvitation = await updateInvitationStatusApi(
        data,
        userEmail
      );

      // Now add user member

      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: true,
          data: verification.data,
        }),
      };
    } catch (error: any) {
      console.error("Error verifying invitation token:", error);

      return {
        statusCode: 500,
        body: JSON.stringify({
          valid: false,
          error: "Failed to verify invitation token",
          message: error.message,
        }),
      };
    }
  }
).use(httpCors());
