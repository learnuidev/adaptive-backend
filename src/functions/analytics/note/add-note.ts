import middy from "@middy/core";
import cors from "@middy/http-cors";
import { addNoteApi } from "./add-note.api.js";

export const handler = middy(async (event: any) => {
  const userId = event.requestContext.authorizer?.claims?.email;

  try {
    const rawParams = JSON.parse(event.body);

    await addNoteApi({
      ...rawParams,
      userId,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        // @ts-ignore
        message: err.message,
      }),
    };
    return response;
  }
}).use(cors());
