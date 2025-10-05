import middy from "@middy/core";
import cors from "@middy/http-cors";

import { addUserWebsiteApi } from "./add-user-website.api.js";

export const handler = middy(async (event) => {
  const userId = event.requestContext.authorizer.claims.email;

  const { title, description, scopes, permissionType, ...rest } = JSON.parse(
    event.body
  );

  const userWebsite = await addUserWebsiteApi({
    title,
    description,
    scopes,
    permissionType,
    userId,
    ...rest,
  });

  const samplePrevious = {
    title: "hello world",
    scopes: ["*"],
    description: "testing",
    id: "cqevpPcSuVFJiPPcWnlWnTR2c/f56Q/ZuQ6bQIVwL8w=",
    userId: "learnuidev@gmail.com",
    apiKey: "cqevpPcSuVFJiPPcWnlWnTR2c/f56Q/ZuQ6bQIVwL8w=",
    apiSecret:
      "adaptive-cqevpPcSuVFJiPPcWnlWnTR2c/f56Q/ZuQ6bQIVwL8w=0937faf42d089f277b36ef4b6f853cf7ac6b72ba8aeb1dfc6ec82922f2989477",
    previewApiSecret: "adaptive-cqe...9477",
    createdAt: 1758989916693,
    urlEndpoint: "https://18crmasvb9.execute-api.us-east-1.amazonaws.com/dev",
    domain: "www.mandarino.io",
  };

  const response = {
    statusCode: 201,
    body: JSON.stringify(userWebsite),
  };
  return response;
}).use(cors());
