const withPermissionsMiddleware =
  (permissions) => async (event, context, next) => {
    try {
      const userCredential = event.userCredential;

      const forbiddenResponse = {
        statusCode: 403,
        body: JSON.stringify({
          message:
            "You dont have the valid permissions to perform this operation",
        }),
      };

      // Edge case, check if the user has access to everything
      if (userCredential?.scopes?.includes("*")) {
        return await next(event, context);
      }

      const containsPermission = permissions?.some((permission) =>
        userCredential?.scopes?.includes(permission)
      );

      if (!containsPermission) {
        return forbiddenResponse;
      }

      return await next(event, context);
    } catch (error) {
      console.error("Error in userExistsMiddleware:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal server error." }),
      };
    }
  };

module.exports = { withPermissionsMiddleware };
