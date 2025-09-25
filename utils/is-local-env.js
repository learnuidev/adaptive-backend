const { env } = require("../constants/api-keys");

const isLocalEnv = () => {
  return env === "local";
};

module.exports = {
  isLocalEnv,
};
