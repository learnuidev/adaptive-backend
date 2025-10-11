import middy from "@middy/core";
import cors from "@middy/http-cors";
import { getLiveUsersApi } from "./get-live-users.api.js";

export const handler = middy(async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const result = await getLiveUsersApi(body);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
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
