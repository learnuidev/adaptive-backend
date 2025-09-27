/* eslint-disable no-undef */
require("dotenv").config();

const defaultRegion = "us-east-1";
const urlEndpoint = `https://18crmasvb9.execute-api.us-east-1.amazonaws.com/dev`;

const apiConfig = {
  region: process.env.REGION || defaultRegion,
  kmsArn: process.env.ADAPTIVE_KMS_ARN,
  urlEndpoint: process.env.ADAPTIVE_URL_ENDPOINT || urlEndpoint,
};

module.exports = {
  apiConfig,
};
