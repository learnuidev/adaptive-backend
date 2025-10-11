import middy from "@middy/core";
import cors from "@middy/http-cors";
import { listUserWebsitesApi } from "./list-user-websites.api.js";
// import { listUserCredentialsApi } from "./list-user-websites.api.js";

const baseHandler = async (event: any) => {
  const userEmail = event.requestContext.authorizer.claims.email;

  const credentials = await listUserWebsitesApi(userEmail);

  return {
    statusCode: 200,
    body: JSON.stringify(credentials),
  };
};

export const handler = middy(baseHandler).use(cors());
