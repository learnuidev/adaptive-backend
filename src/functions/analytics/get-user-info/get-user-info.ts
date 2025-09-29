import middy from "@middy/core";
import cors from "@middy/http-cors";
import { getUserInfoApi } from "./get-user-info.api.js";

export const handler = middy(async (event) => {
  try {
    const { websiteId, email } = JSON.parse(event.body);

    console.log("yoo");

    const summary = await getUserInfoApi({
      websiteId,
      email,
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify(summary),
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
