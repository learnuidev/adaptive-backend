import { getUserCredentialById } from "../user-credentials/get-user-credential-by-id.api.js";
import { generatePolicy } from "./generate-policy.js";

export const validateWebSiteId = async (event: any) => {
  const websiteId = JSON.parse(event.body)?.websiteId;

  const userRequestDomain = event.headers?.origin;

  const errorMessage = `Unauthorized: ${JSON.stringify(event?.headers)}`;

  if (!websiteId) {
    throw new Error(errorMessage);
  }

  const userCredential = await getUserCredentialById(websiteId);
  // Extract userRequestDomain from event headers, e.g. Host header

  if (!userCredential) {
    throw new Error(errorMessage);
  }

  if (!userRequestDomain) {
    throw new Error(errorMessage);
  }

  // if (userCredential.domains) {
  //   if (userCredential?.domains?.includes(userRequestDomain)) {
  //     return generatePolicy("user", "Allow", event.methodArn, userCredential);
  //   } else {
  //     throw new Error(errorMessage);
  //   }
  // }

  if (!userRequestDomain?.includes(userCredential.domain)) {
    throw new Error(errorMessage);
  }

  return userCredential;
};
