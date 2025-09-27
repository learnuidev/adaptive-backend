import { confirmUserSignuApi } from "./confirm-user-signup.api.js";

export const handler = async (event: any) => {
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    const { email } = event.request.userAttributes;

    await confirmUserSignuApi({ email });

    return event;
  } else {
    // otherwise do nothing
    return event;
  }
};
