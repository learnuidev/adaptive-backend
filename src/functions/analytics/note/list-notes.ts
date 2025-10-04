import middy from "@middy/core";
import cors from "@middy/http-cors";
import { listNotesByWebsiteId } from "./list-notes.api.js";

export const handler = middy(async (event: any) => {
  try {
    const rawParams = JSON.parse(event.body);

    const notes = await listNotesByWebsiteId({
      websiteId: rawParams.websiteId,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify(notes),
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
