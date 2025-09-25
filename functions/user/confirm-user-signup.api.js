const AWS = require("aws-sdk");
const ulid = require("ulid");

const { tableNames } = require("../../constants/table-names");
const { apiConfig } = require("../../constants/api-config");

const dynamodb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: apiConfig.region,
});

const confirmUserSignuApi = async ({ email }) => {
  const userId = ulid.ulid();

  const user = {
    email,
    id: userId,
    roles: ["roles/customer"],
    createdAt: new Date().toJSON(),
  };

  // create new user
  await dynamodb
    .put({
      TableName: tableNames.usersTable,
      Item: user,
      ConditionExpression: "attribute_not_exists(email)",
    })
    .promise();

  // create new user preference
  await dynamodb
    .put({
      TableName: tableNames.userPreferenceTable,
      Item: {
        userId,
        createdAt: new Date().toJSON(),
      },
      ConditionExpression: "attribute_not_exists(userId)",
    })
    .promise();
};

module.exports = {
  confirmUserSignuApi,
};
