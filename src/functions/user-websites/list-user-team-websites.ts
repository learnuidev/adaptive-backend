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

export const listUserTeamWebsites = async (userEmail: string) => {
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

  // If team memberships exist, fetch all the websites by website id
  const teamCredentials = [];
  const teamWebsiteIds = [
    ...new Set(teamMemberships.map((membership: any) => membership.websiteId)),
  ];

  if (teamWebsiteIds.length > 0) {
    // Use BatchGet for better performance
    const batchGetParams = {
      RequestItems: {
        [tableNames.userCredentialsTable]: {
          Keys: teamWebsiteIds.map((websiteId) => ({
            id: websiteId,
          })),
        },
      },
    };

    const batchGetResp = await dynamodb.send(
      new BatchGetCommand(batchGetParams)
    );
    if (
      batchGetResp.Responses &&
      batchGetResp.Responses[tableNames.userCredentialsTable]
    ) {
      teamCredentials.push(
        ...batchGetResp.Responses[tableNames.userCredentialsTable]
      );
    }
  }

  // Concatenate the results with credentials
  return teamCredentials;
};
