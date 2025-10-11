import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import {
  listTeamMembersByWebsiteIdApi,
  ListTeamMembersByWebsiteIdRequestSchema,
} from "./list-team-members-by-website-id.api.js";

function createResponse(statusCode: number, message: any) {
  const resp = {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };

  return resp;
}

export const listTeamMembersByWebsiteIdHandler: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  try {
    const websiteId = event.pathParameters?.websiteId;

    if (!websiteId) {
      return createResponse(400, { message: "websiteId is required" });
    }

    const request = { websiteId };
    const validatedRequest =
      ListTeamMembersByWebsiteIdRequestSchema.parse(request);

    const teamMembers = await listTeamMembersByWebsiteIdApi(validatedRequest);

    return createResponse(200, {
      message: "Team members retrieved successfully",
      data: teamMembers,
    });
  } catch (error) {
    console.error("Error retrieving team members:", error);
    return createResponse(500, "Internal server error");
  }
};

export const handler = middy(listTeamMembersByWebsiteIdHandler).use(cors());
