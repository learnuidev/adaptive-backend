import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createTeamInvitationApi } from "./create-team-invitation.api.js";

import middy from "@middy/core";
import httpCors from "@middy/http-cors";
import { CreateInvitationRequestSchema } from "adaptive.fyi";

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
      const validationResult = CreateInvitationRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Invalid request body",
            details: validationResult.error.issues,
          }),
        };
      }

      const invitation = await createTeamInvitationApi(validationResult.data);

      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          data: invitation,
        }),
      };
    } catch (error: any) {
      console.error("Error creating team invitation:", error);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to create team invitation",
          message: error.message,
        }),
      };
    }
  }
).use(httpCors());
