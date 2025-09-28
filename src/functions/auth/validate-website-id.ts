import { getUserCredentialById } from "../user-credentials/get-user-credential-by-id.api.js";

export const validateWebSiteId = async (event: any) => {
  const websiteId = JSON.parse(event.body)?.websiteId;

  const userRequestDomain = event.headers?.origin;

  const errorMessage = `Unauthorized: ${JSON.stringify(event?.headers)}`;

  if (!websiteId) {
    throw new Error(errorMessage);
  }

  const userCredential = await getUserCredentialById(websiteId);

  if (!userCredential) {
    throw new Error(errorMessage);
  }

  if (!userRequestDomain?.includes(userCredential.domain)) {
    throw new Error(errorMessage);
  }

  return userCredential;
};
