const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DynamoDBDocumentClient,
} = require("@aws-sdk/lib-dynamodb");
const ulid = require("ulid");

const { removeNull } = require("../../utils/remove-null");
const { tableNames } = require("../../constants/table-names");
const { apiConfig } = require("../../constants/api-config");
const { constructParams } = require("../../utils/construct-params");

// Create low-level DynamoDB client (singleton)
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

// Wrap with high-level DocumentClient
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

const getIdentity = async (emailAndDeviceType) => {
  const params = {
    TableName: tableNames.identityTable,
    IndexName: "byEmailAndDeviceType",
    KeyConditionExpression: "emailAndDeviceType = :emailAndDeviceType",
    ExpressionAttributeValues: {
      ":emailAndDeviceType": emailAndDeviceType,
    },
  };

  const resp = await dynamodb.send(new QueryCommand(params));

  return resp.Items?.[0];
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
    });

    const updatedStepParams = constructParams({
      tableName: tableNames.identityTable,
      attributes: params,
    });

    // Use UpdateCommand for update
    await dynamodb.send(new UpdateCommand(updatedStepParams));

    return params;
  }

  const id = ulid.ulid();

  const params = removeNull({ id, ...props, createdAt: Date.now() });

  const inputParams = {
    TableName: tableNames.identityTable,
    Item: params,
  };

  await dynamodb.send(new PutCommand(inputParams));

  return params;
};

module.exports = {
  identifyApi,
};
