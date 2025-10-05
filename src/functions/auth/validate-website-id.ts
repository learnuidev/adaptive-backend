import { getUserWebsiteById } from "../user-websites/get-user-website-by-id.api.js";

export const validateWebSiteId = async (event: any) => {
  const websiteId = JSON.parse(event.body)?.websiteId;

  const userRequestDomain = event.headers?.origin;

  const errorMessage = `Unauthorized: ${JSON.stringify(event?.headers)}`;

  if (!websiteId) {
    throw new Error(errorMessage);
  }

  const userWebsite = await getUserWebsiteById(websiteId);

  if (!userWebsite) {
    throw new Error(errorMessage);
  }

  if (!userRequestDomain?.includes(userWebsite.domain)) {
    throw new Error(errorMessage);
  }

  return userWebsite;
};
