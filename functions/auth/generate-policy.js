function generatePolicy(principalId, effect, resource, userInfo) {
  return {
    principalId: principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: {
      userId: userInfo?.userId,
      email: userInfo?.userId,
      userCredentialId: userInfo.id,
    },
  };
}

module.exports = {
  generatePolicy,
};
