import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

import { removeNull } from "../../utils/remove-null.js";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";
import { constructParams } from "../../utils/construct-params.js";
import { clickhouseClient } from "../../lib/clickhouse-client.js";

// Create low-level DynamoDB client (singleton)
const ddbClient = new DynamoDBClient({
  region: apiConfig.region,
  apiVersion: "2012-08-10",
});

const marshallOpts = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
  convertClassInstanceToMap: true, // Enable conversion of class instances to map attributes
};

const unmarshallOpts = {
  wrapNumbers: false,
};

const translateConfig = {
  marshallOptions: marshallOpts,
  unmarshallOptions: unmarshallOpts,
};

// Wrap with high-level DocumentClient
const dynamodb = DynamoDBDocumentClient.from(ddbClient, translateConfig);

const getIdentity = async (emailAndDeviceType: string) => {
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

export const identifyApi = async (props: any) => {
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

    if (clickhouseClient) {
      await clickhouseClient.ingestDDBIdentity(
        clickhouseClient.client,
        updatedStepParams
      );
    }

    return params;
  }

  const id = ulid();

  const params = removeNull({ id, ...props, createdAt: Date.now() });

  const inputParams = {
    TableName: tableNames.identityTable,
    Item: params,
  };

  await dynamodb.send(new PutCommand(inputParams));

  if (clickhouseClient) {
    await clickhouseClient.ingestDDBIdentity(clickhouseClient.client, params);
  }

  return params;
};

// const input = {
//   ipAddress: "45.144.115.137",
//   email: "learnuidev@gmail.com",
//   websiteId: "mando-prod",
//   emailAndDeviceType:
//     '"learnuidev@gmail.com"#"macOS_10.15.7#Macintosh_Apple#Chrome_140.0.0.0"#"mando-prod"',
//   location: {
//     range: [764441088, 764441599],
//     country: "US",
//     region: "VA",
//     eu: "0",
//     timezone: "America/New_York",
//     city: "Ashburn",
//     ll: [39.018, -77.539],
//     metro: 511,
//     area: 20,
//   },
//   userAgentInfo: {
//     browser: {
//       name: "Chrome",
//       version: "140.0.0.0",
//       major: "140",
//     },
//     device: {
//       model: "Macintosh",
//       vendor: "Apple",
//     },
//     os: {
//       name: "macOS",
//       version: "10.15.7",
//     },
//   },
// };

// identifyApi(input).then((resp) => {
//   console.log("resp", resp);
// });
