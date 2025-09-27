/* eslint-disable no-undef */
require("dotenv").config();

const defaultRegion = "us-east-1";

const apiConfig = {
  region: process.env.REGION || defaultRegion,
  kmsArn: process.env.ADAPTIVE_KMS_ARN,
};

module.exports = {
  apiConfig,
};
