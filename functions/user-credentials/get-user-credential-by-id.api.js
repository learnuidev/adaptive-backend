const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { apiConfig } = require("../../constants/api-config");
const { tableNames } = require("../../constants/table-names");

const ddbClient = new DynamoDBClient({
  apiVersion: "2012-08-10",
  region: apiConfig.region,
});

// Create high-level DocumentClient wrapper
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

async function getUserCredentialById(apiKeyId) {
  // fetch item
  const resp = await dynamodb.send(
    new GetCommand({
      TableName: tableNames.userCredentialsTable,
      Key: {
        id: apiKeyId,
      },
    })
  );

  const userCredential = resp?.Item;

  return userCredential;
}

module.exports = {
  getUserCredentialById,
};
