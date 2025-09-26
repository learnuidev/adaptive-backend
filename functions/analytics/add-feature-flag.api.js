const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const ulid = require("ulid");

const { removeNull } = require("../../utils/remove-null");
const { apiConfig } = require("../../constants/api-config");
const { tableNames } = require("../../constants/table-names");

// Create low-level DynamoDB client once
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with DocumentClient for convenience
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

const addFeatureFlagsApi = async (props) => {
  const id = ulid.ulid();

  const params = removeNull({ id, ...props, createdAt: Date.now() });

  const inputParams = {
    TableName: tableNames.featureFlagsTable,
    Item: params,
  };

  // Equivalent to .put(...).promise()
  await dynamodb.send(new PutCommand(inputParams));

  return params;
};

module.exports = {
  addFeatureFlagsApi,
};
