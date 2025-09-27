import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

import { removeNull } from "../../utils/remove-null";
import { tableNames } from "../../../constants/table-names";
import { apiConfig } from "../../../constants/api-config";
import { clickhouseClient } from "../../lib/clickhouse-client";

export const addEventsApi = async (props) => {
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
