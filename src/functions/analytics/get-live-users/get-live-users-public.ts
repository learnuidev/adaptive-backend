import middy from "@middy/core";
import cors from "@middy/http-cors";
import { getLiveUsersApi } from "./get-live-users.api.js";
import { validateApiKey } from "../../auth/validate-api-key.js";

export const handler = middy(async (event: any) => {
  const apiKey = event.headers["x-api-key"];

  const apiKeyItem = await validateApiKey(apiKey);

  if (!apiKeyItem) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Unauthorized",
      }),
    };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const result = await getLiveUsersApi({
      ...body,
      // @ts-ignore
      websiteId: apiKeyItem?.websiteId,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error in getLiveUsers handler:", error);

    // Handle validation errors
    if (error.name === "ZodError") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Validation error",
          details: error.errors,
        }),
      };
    }

    // Handle other errors
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
}).use(cors());
