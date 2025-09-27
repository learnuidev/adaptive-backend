import { ulid } from "ulid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import { tableNames } from "../../constants/table-names.mjs";
import { apiConfig } from "../../constants/api-config.mjs";

const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
});

const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const confirmUserSignuApi = async ({ email }) => {
  const userId = ulid();

  const user = {
    email,
    id: userId,
    roles: ["roles/customer"],
    createdAt: new Date().toISOString(),
  };

  // Create new user with condition to avoid overwriting existing email
  await dynamodb.send(
    new PutCommand({
      TableName: tableNames.usersTable,
      Item: user,
      ConditionExpression: "attribute_not_exists(email)",
    })
  );

  // Create new user preference with condition to avoid overwriting existing userId
  await dynamodb.send(
    new PutCommand({
      TableName: tableNames.userPreferenceTable,
      Item: {
        userId,
        createdAt: new Date().toISOString(),
      },
      ConditionExpression: "attribute_not_exists(userId)",
    })
  );
};
