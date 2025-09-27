const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const { apiConfig } = require("../../constants/api-config");
const { tableNames } = require("../../constants/table-names");

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
});

const dynamodb = DynamoDBDocumentClient.from(ddbClient);

const deleteUserCredentialApi = async ({ credentialId, userId }) => {
  // Get the item by credentialId
  const getParams = {
    TableName: tableNames.userCredentialsTable,
    Key: { id: credentialId },
  };
  const resp = await dynamodb.send(new GetCommand(getParams));
  const credential = resp.Item;

  if (!credential) {
    return null;
  }

  if (credential.userId !== userId) {
    return null;
  }

  // Delete the item
  const deleteParams = {
    TableName: tableNames.userCredentialsTable,
    Key: { id: credentialId },
  };

  await dynamodb.send(new DeleteCommand(deleteParams));

  return {
    success: true,
    message: `Credential with id: ${credentialId} deleted successfully`,
  };
};

module.exports = {
  deleteUserCredentialApi,
};
