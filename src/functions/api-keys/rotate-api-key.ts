import { rotateApiKeyApi } from "./rotate-api-key.api.js";

export const handler = async (event: any) => {
  console.log("=== rotate-api-key handler started ===");
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

    const result = await rotateApiKeyApi({ id, userId });
    
    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "API key not found or unauthorized" }),
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error in rotate-api-key handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
