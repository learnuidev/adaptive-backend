import { createApiKeyApi } from "./create-api-key.api.js";

export const handler = async (event: any) => {
  console.log("=== create-api-key handler started ===");
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const userId = event.requestContext.authorizer.claims.email;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const newApiKey = await createApiKeyApi({ userId, ...body });

    return {
      statusCode: 201,
      body: JSON.stringify(newApiKey),
    };
  } catch (error) {
    console.error("Error in create-api-key handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
