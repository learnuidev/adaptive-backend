import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { tableNames } from "../../constants/table-names";
import { removeNull } from "../../utils/remove-null";
import { constructParams } from "../../utils/construct-params";
import { apiConfig } from "../../constants/api-config";

const ddbClient = new DynamoDBClient({ region: apiConfig.region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const updateUserCredentialApi = async ({
  id,
  title,
  description,
  scopes,
  permissionType,
  userId,
}) => {
  // Retrieve existing item
  const getParams = {
    TableName: tableNames.userCredentialsTable,
    Key: { id },
  };
  const itemResponse = await dynamodb.send(new GetCommand(getParams));
  const userCredential = itemResponse.Item;

  if (!userCredential) {
    return null;
  }

  if (userCredential.userId !== userId) {
    return null;
  }

  // Prepare updated parameters, removing null values
  const params = removeNull({
    id,
    ...userCredential,
    title,
    description,
    scopes,
    permissionType,
    updatedAt: Date.now(),
  });

  // Construct update expression and attribute values
  const updateParams = constructParams({
    tableName: tableNames.userCredentialsTable,
    attributes: params,
  });

  await dynamodb.send(new UpdateCommand(updateParams));

  return params;
};
