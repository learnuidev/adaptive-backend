const AWS = require("aws-sdk");
const ulid = require("ulid");

const { removeNull } = require("../../utils/remove-null");
const { tableNames } = require("../../constants/table-names");
const { apiConfig } = require("../../constants/api-config");

const addEventsApi = async (props) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
    region: apiConfig.region,
  });

  const id = ulid.ulid();

  const params = removeNull({ id, ...props, createdAt: Date.now() });

  const inputParams = {
    Item: params,
    TableName: tableNames.analyticsTable,
  };

  await dynamodb.put(inputParams).promise();

  return params;
};

module.exports = {
  addEventsApi,
};
