require("dotenv").config();

const defaultRegion = "us-east-1";

const apiConfig = {
  region: process.env.REGION || defaultRegion,
};

module.exports = {
  apiConfig,
};
