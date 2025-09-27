import middy from "@middy/core";
import cors from "@middy/http-cors";
import { listUserCredentialsApi } from "./list-user-credentials.api.js";

const baseHandler = async (event) => {
  const userEmail = event.requestContext.authorizer.claims.email;
  const credentials = await listUserCredentialsApi(userEmail);

  return {
    statusCode: 200,
    body: JSON.stringify(credentials),
  };
};

export const handler = middy(baseHandler).use(cors());
