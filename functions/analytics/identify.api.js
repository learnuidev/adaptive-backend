const AWS = require("aws-sdk");
const ulid = require("ulid");

const { removeNull } = require("../../utils/remove-null");
const { tableNames } = require("../../constants/table-names");
const { apiConfig } = require("../../constants/api-config");

const { constructParams } = require("../../utils/construct-params");

const dynamodb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: apiConfig.region,
});

const getIdentity = async (emailAndDeviceType) => {
  const params = {
    ExpressionAttributeValues: {
      ":emailAndDeviceType": emailAndDeviceType,
    },
    KeyConditionExpression: "emailAndDeviceType = :emailAndDeviceType",
    IndexName: "byEmailAndDeviceType",
    TableName: tableNames.identityTable,
  };

  const resp = await dynamodb.query(params).promise();

  return resp.Items[0];
};

const identifyApi = async (props) => {
  // Using emailAndDeviceType as the primary key to upsert
  const { emailAndDeviceType, ...rest } = props;

  const identity = await getIdentity(emailAndDeviceType);

  if (identity) {
    const params = removeNull({
      ...identity,
      ...rest,
      updatedAt: Date.now(),
      // data_version: "2023-10-07",
      // status,
      // next_review_date,
    });

    const updatedStepParams = constructParams({
      tableName: tableNames.identityTable,
      attributes: params,
    });

    await dynamodb.update(updatedStepParams).promise();

    return params;
  }

  const id = ulid.ulid();

  const params = removeNull({ id, ...props, createdAt: Date.now() });

  const inputParams = {
    Item: params,
    TableName: tableNames.identityTable,
  };

  await dynamodb.put(inputParams).promise();

  return params;
};

module.exports = {
  identifyApi,
};
