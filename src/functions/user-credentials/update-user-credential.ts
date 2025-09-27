import middy from "@middy/core";
import cors from "@middy/http-cors";
import { updateUserCredentialApi } from "./update-user-credential.api.js";

export const handler = middy(async (event: any) => {
  const { id, title, description, scopes, permissionType } = JSON.parse(
    event.body
  );

  const userId = event.requestContext.authorizer.claims.email;

  try {
    const userCredential = await updateUserCredentialApi({
      id,
      title,
      description,
      scopes,
      permissionType,
      userId,
    });

    if (!userCredential) {
      const response = {
        statusCode: 401,
        body: JSON.stringify({
          message: `User credential with id: ${id} does not exist.`,
        }),
      };
      return response;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify(userCredential),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        message: err.message,
      }),
    };
    return response;
  }
}).use(cors());
