import middy from "@middy/core";
import cors from "@middy/http-cors";

import { listUserTeamWebsites } from "./list-user-team-websites.js";
import { listUserWebsitesApi } from "./list-user-websites.api.js";

const baseHandler = async (event: any) => {
  const userEmail = event.requestContext.authorizer.claims.email;

  // Get user's own websites
  const userCredentials = await listUserWebsitesApi(userEmail);

  // Team Support
  const teamCredentials = await listUserTeamWebsites(userEmail);

  // Concatenate the results with credentials
  const allCredentials = [...userCredentials, ...teamCredentials];

  // Remove duplicates based on item id
  const uniqueCredentials = allCredentials.filter(
    (item, index, self) => index === self.findIndex((i) => i.id === item.id)
  );

  return {
    statusCode: 200,
    body: JSON.stringify(uniqueCredentials),
  };
};

export const handler = middy(baseHandler).use(cors());
