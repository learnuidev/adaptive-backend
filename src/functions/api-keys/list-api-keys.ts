import { listApiKeysApi } from "./list-api-keys.api.js";

export const handler = async (event: any) => {
  console.log("=== list-api-keys handler started ===");
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const { websiteId } = JSON.parse(event.body);
    const userId = event.requestContext.authorizer.claims.email;

    if (!websiteId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "websiteId is required" }),
      };
    }

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const result = await listApiKeysApi({ websiteId, userId });
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error in list-api-keys handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
