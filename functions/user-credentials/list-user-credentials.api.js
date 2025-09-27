const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { apiConfig } = require("../../constants/api-config");
const { tableNames } = require("../../constants/table-names");

const ddbClient = new DynamoDBClient({ region: apiConfig.region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

const listUserCredentialsApi = async (userId) => {
  const params = {
    TableName: tableNames.userCredentialsTable,
    IndexName: "byUserId",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  const resp = await dynamodb.send(new QueryCommand(params));

  return resp.Items.map((item) => ({
    ...item,
    apiSecret: `***********`,
  }));
};

module.exports = {
  listUserCredentialsApi,
};
