import { generatePolicy } from "./generate-policy.js";
import { validateWebSiteId } from "./validate-website-id.js";

export const handler = async (event: any) => {
  const userCredential = await validateWebSiteId(event);

  if (userCredential) {
    return generatePolicy("user", "Allow", event.methodArn, userCredential);
  } else {
    throw new Error("Unauthorized");
  }
};
