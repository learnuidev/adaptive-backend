import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createTeamApi, CreateTeamRequestSchema } from "./create-team.api.js";

import middy from "@middy/core";
import httpCors from "@middy/http-cors";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Request body is required" }),
        };
      }

      // Extract user info from Cognito authorizer context
      const userClaims = event.requestContext?.authorizer?.claims;
      if (!userClaims) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "User authentication required" }),
        };
      }

      const ownerUserId = userClaims.sub; // Cognito User ID

      const body = JSON.parse(event.body);
      const validationResult = CreateTeamRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Invalid request body",
            details: validationResult.error.issues,
          }),
        };
      }

      const team = await createTeamApi(validationResult.data, ownerUserId);

      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          data: team,
        }),
      };
    } catch (error: any) {
      console.error("Error creating team:", error);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to create team",
          message: error.message,
        }),
      };
    }
  }
).use(httpCors());
