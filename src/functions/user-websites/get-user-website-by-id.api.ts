import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";

const ddbClient = new DynamoDBClient({
  apiVersion: "2012-08-10",
  region: apiConfig.region,
});

// Create high-level DocumentClient wrapper
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export async function getUserWebsiteById(apiKeyId: string) {
  // fetch item
  const resp = await dynamodb.send(
    new GetCommand({
      TableName: tableNames.userCredentialsTable,
      Key: {
        id: apiKeyId,
      },
    })
  );

  const website = resp?.Item;

  return website;
}
