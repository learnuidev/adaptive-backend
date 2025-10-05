import middy from "@middy/core";
import cors from "@middy/http-cors";
import { addCohortApi } from "./add-cohort.api.js";

export const handler = middy(async (event) => {
  const userId = event.requestContext.authorizer?.claims?.email;

  try {
    const rawParams = JSON.parse(event.body);

    const newCohort = await addCohortApi(rawParams);

    const response = {
      statusCode: 200,
      body: JSON.stringify(newCohort),
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
