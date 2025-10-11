import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { apiConfig } from "../../constants/api-config.js";
import { tableNames } from "../../constants/table-names.js";

const ddbClient = new DynamoDBClient({ region: apiConfig.region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

export const listUserTeamMembershipsApi = async (userEmail: string) => {
  // Add support for teams
  // Fetch all the items in TeamMembersTable using by-email index
  const teamParams = {
    TableName: tableNames.teamMembersTable,
    IndexName: "by-email",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": userEmail,
    },
  };

  const teamResp = await dynamodb.send(new QueryCommand(teamParams));
  const teamMemberships = teamResp?.Items || [];

  return teamMemberships;
};
