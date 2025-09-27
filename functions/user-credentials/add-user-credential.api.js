const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const crypto = require("crypto");

const { apiConfig } = require("../../constants/api-config");
const { tableNames } = require("../../constants/table-names");
const { removeNull } = require("../../utils/remove-null");
const cryptoV2 = require("../../lib/crypto-v2").cryptoV2;

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Create high-level DocumentClient wrapper
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

function generateApiKey(size = 32) {
  return crypto.randomBytes(size).toString("base64");
}

function generateApiSecret(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

const addUserCredentialApi = async ({
  title,
  description,
  scopes,
  permissionType,
  userId,
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
    previewApiSecret: `adaptive-${prefix}...${suffix}`,
    createdAt,
  };

  var params = {
    TableName: tableNames.userCredentials,
    Item: removeNull(credentialParams),
  };

  // Call DynamoDB to add the item to the table
  await dynamodb.send(new PutCommand(params));

  console.log(`=== Successfully added credential for user - ${userId} ===`);

  const response = {
    ...credentialParams,
    apiSecret: `adapt-${apiKey}${apiSecret}`,
  };
  return response;
};

module.exports = {
  addUserCredentialApi,
};
