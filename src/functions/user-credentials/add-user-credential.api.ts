import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import crypto from "crypto";

import { apiConfig } from "../../constants/api-config";
import { tableNames } from "../../constants/table-names";
import { removeNull } from "../../utils/remove-null";
import { credentialsPrefix } from "./user-credentials.constants";
import { cryptoV2 } from "../../lib/crypto-v2";

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// eslint-disable-next-line no-unused-vars
const sample = {
  apiSecret: "",
  previewApiSecret: "adaptive-who...319c",
  apiKey: "whowtlTBt+8C/XHCPH31K+vj8iflASMvb0BP+/EBqnI=",
  userId: "learnuidev@gmail.com",
  permissionType: "all",
  createdAt: 1738206260327,
  scopes: [
    "component.write",
    "character.write",
    "content.write",
    "ai.write",
    "search.read",
    "analytics.read",
    "review.write",
  ],
  id: "whowtlTBt+8C/XHCPH31K+vj8iflASMvb0BP+/EBqnI=",
  title: "my-first-api-key",
};

// Create high-level DocumentClient wrapper
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

function generateApiKey(size = 32) {
  return crypto.randomBytes(size).toString("base64");
}

function generateApiSecret(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

export const addUserCredentialApi = async ({
  title,
  description,
  scopes,
  permissionType,
  userId,
  ...rest
}) => {
  const crypto = cryptoV2({ keyArn: apiConfig.kmsArn });

  const apiKey = generateApiKey();
  const apiSecret = generateApiSecret();

  const { result } = await crypto.encrypt(apiSecret);

  console.log(`Successfully encryped api secret for : ${userId}`);

  const createdAt = Date.now();

  const prefix = apiKey?.slice(0, 3);
  const suffix = apiSecret.slice(-4);
  const credentialParams = {
    title,
    scopes,
    description,
    id: apiKey,
    userId,
    apiKey,
    apiSecret: result,
    permissionType,
    previewApiSecret: `${credentialsPrefix}${prefix}...${suffix}`,
    createdAt,
    urlEndpoint: apiConfig.urlEndpoint,
    ...rest,
  };

  var params = {
    TableName: tableNames.userCredentialsTable,
    Item: removeNull(credentialParams),
  };

  // Call DynamoDB to add the item to the table
  await dynamodb.send(new PutCommand(params));

  console.log(`=== Successfully added credential for user - ${userId} ===`);

  const response = {
    ...credentialParams,
    apiSecret: `${credentialsPrefix}${apiKey}${apiSecret}`,
  };
  return response;
};
