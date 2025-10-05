// Middlewares
import middy from "@middy/core";
import cors from "@middy/http-cors";
import { deleteUserWebsiteApi } from "./delete-user-website.api.js";
// import { deleteUserCredentialApi } from "./delete-user-website.api.js";

export const handler = middy(async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.email;
    const { websiteId } = JSON.parse(event.body);

    const deletedCredential = await deleteUserWebsiteApi({
      websiteId,
      userId,
    });

    if (!deletedCredential) {
      const response = {
        statusCode: 404,
        body: JSON.stringify({
          message: `Website with id: ${websiteId} not found`,
        }),
      };
      return response;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: deletedCredential.message,
      }),
    };
    return response;
  } catch (error) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({ error }),
    };
  }
}).use(cors());
