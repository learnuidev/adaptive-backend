import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { apiConfig } from "../../constants/api-config.mjs";
import { tableNames } from "../../constants/table-names.mjs";

const ddbClient = new DynamoDBClient({
  apiVersion: "2012-08-10",
  region: apiConfig.region,
});

// Create high-level DocumentClient wrapper
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export async function getUserCredentialById(apiKeyId) {
  // fetch item
  const resp = await dynamodb.send(
    new GetCommand({
      TableName: tableNames.userCredentialsTable,
      Key: {
        id: apiKeyId,
      },
    })
  );

  const userCredential = resp?.Item;

  return userCredential;
}
