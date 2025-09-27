const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const ulid = require("ulid");

const { removeNull } = require("../../utils/remove-null");
const { tableNames } = require("../../constants/table-names");
const { apiConfig } = require("../../constants/api-config");
const { clickhouseClient } = require("../../lib/clickhouse-client");

const addEventsApi = async (props) => {
  // Create low-level DynamoDB client
  const ddbClient = new DynamoDBClient({
    region: apiConfig.region,
    apiVersion: "2012-08-10",
  });

  // Create high-level DocumentClient wrapper
  const dynamodb = DynamoDBDocumentClient.from(ddbClient);

  const id = ulid.ulid();
  const params = removeNull({ id, ...props, createdAt: Date.now() });

  const inputParams = {
    TableName: tableNames.eventsTable,
    Item: params,
  };

  // Use `PutCommand` from @aws-sdk/lib-dynamodb
  await dynamodb.send(new PutCommand(inputParams));

  if (clickhouseClient) {
    await clickhouseClient.ingestDDBEvent(clickhouseClient.client, params);
  }

  return params;
};

module.exports = {
  addEventsApi,
};
