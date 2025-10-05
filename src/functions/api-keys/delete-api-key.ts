import middy from "@middy/core";
import cors from "@middy/http-cors";
import { deleteApiKeyApi } from "./delete-api-key.api.js";

export const handler = middy(async (event: any) => {
  console.log("=== delete-api-key handler started ===");
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const { id } = JSON.parse(event.body);
    const userId = event.requestContext.authorizer.claims.email;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "API key ID is required" }),
      };
    }

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const result = await deleteApiKeyApi({ id, userId });
    
    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "API key not found or unauthorized" }),
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "API key deleted successfully" }),
    };
  } catch (error) {
    console.error("Error in delete-api-key handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}).use(cors());
