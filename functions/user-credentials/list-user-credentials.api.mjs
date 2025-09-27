import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { apiConfig } from "../../constants/api-config.mjs";
import { tableNames } from "../../constants/table-names.mjs";

const ddbClient = new DynamoDBClient({ region: apiConfig.region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const listUserCredentialsApi = async (userId) => {
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
