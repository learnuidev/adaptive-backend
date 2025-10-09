import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { updateInvitationStatusApi } from "./update-invitation-status.api.js";
// import { UpdateInvitationStatusRequestSchema } from "./team-invitations.types.js";
import middy from "@middy/core";
import httpCors from "@middy/http-cors";
import { UpdateInvitationStatusRequestSchema } from "adaptive.fyi";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Request body is required" }),
        };
      }

      const body = JSON.parse(event.body);
      const validationResult =
        UpdateInvitationStatusRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Invalid request body",
            details: validationResult.error.issues,
          }),
        };
      }

      // Extract user email from the Cognito authorizer context (if available)
      const userEmail = event.requestContext?.authorizer?.claims?.email;

      const updatedInvitation = await updateInvitationStatusApi(
        validationResult.data,
        userEmail
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: updatedInvitation,
        }),
      };
    } catch (error: any) {
      console.error("Error updating invitation status:", error);

      // Handle specific error cases
      if (error.message.includes("not found")) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: error.message }),
        };
      }

      if (
        error.message.includes("can only update") ||
        error.message.includes("already been") ||
        error.message.includes("has expired")
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to update invitation status",
          message: error.message,
        }),
      };
    }
  }
).use(httpCors());
