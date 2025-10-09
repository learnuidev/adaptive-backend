import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { listTeamInvitationsApi } from "./list-team-invitations.api.js";
// import { ListInvitationsQuerySchema } from "./team-invitations.types.js";
import middy from "@middy/core";
import { ListInvitationsQuerySchema } from "adaptive.fyi";
import httpCors from "@middy/http-cors";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = {
      websiteId: event.queryStringParameters?.websiteId,
      status: event.queryStringParameters?.status,
      email: event.queryStringParameters?.email,
      limit: event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit)
        : undefined,
      offset: event.queryStringParameters?.offset
        ? parseInt(event.queryStringParameters.offset)
        : undefined,
    };

    const validationResult = ListInvitationsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid query parameters",
          details: validationResult.error.issues,
        }),
      };
    }

    const result = await listTeamInvitationsApi(validationResult.data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.invitations,
        pagination: {
          total: result.total,
          limit: validationResult.data.limit,
          offset: validationResult.data.offset,
        },
      }),
    };
  } catch (error: any) {
    console.error("Error listing team invitations:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to list team invitations",
        message: error.message,
      }),
    };
  }
};

export const main = middy(handler).use(httpCors());
