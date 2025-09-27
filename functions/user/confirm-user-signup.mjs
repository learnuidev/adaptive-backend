import { confirmUserSignuApi } from "./confirm-user-signup.api.mjs";

export const handler = async (event) => {
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    const { email } = event.request.userAttributes;

    await confirmUserSignuApi({ email });

    return event;
  } else {
    // otherwise do nothing
    return event;
  }
};
