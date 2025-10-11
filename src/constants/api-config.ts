import dotenv from "dotenv";
/* eslint-disable no-undef */
dotenv.config();

const defaultRegion = "us-east-1";
const urlEndpoint = `https://18crmasvb9.execute-api.us-east-1.amazonaws.com/dev`;

const apiConfig = {
  region: process.env.REGION || defaultRegion,
  kmsArn: process.env.ADAPTIVE_KMS_ARN,
  urlEndpoint: process.env.ADAPTIVE_URL_ENDPOINT || urlEndpoint,
  fromEmailAddress: process.env.FROM_EMAIL_ADDRESS || "learnuidev@gmail.com",
  frontendUrl: process.env.FRONTEND_URL,
  resendApiKey: process.env.RESEND_API_KEY,
};

export { apiConfig };
