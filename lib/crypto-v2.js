const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
const { Credentials } = require("@aws-sdk/types"); // For typing, else import from aws-sdk as fallback

const {
  KmsKeyringNode,
  buildClient,
  CommitmentPolicy,
} = require("@aws-crypto/client-node");
const { apiConfig } = require("../constants/api-config");

const { encrypt, decrypt } = buildClient(
  CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
);

const context = {
  stage: "dev",
  purpose: "Decrypting AWS Client Secret",
  origin: apiConfig.region,
};

function generateApiKey(size = 32) {
  return crypto.randomBytes(size).toString("base64");
}

function generateApiSecret(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

const cryptoV2 = ({ keyArn }) => {
  const generatorKeyId = keyArn;
  const keyIds = [keyArn];

  const keyring = new KmsKeyringNode({ generatorKeyId, keyIds });

  // DynamoDB v3 client setup
  const ddbClient = new DynamoDBClient({ region: apiConfig.region });
  const dynamodb = DynamoDBDocumentClient.from(ddbClient);

  const getCredentials = async ({
    userId,
    tableName,
    profile,
    extensionId = "AWS",
  }) => {
    const params = {
      TableName: tableName,
      IndexName: "byUser",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const resp = await dynamodb.send(new QueryCommand(params));

    let awsIntegration;

    if (profile) {
      awsIntegration = resp.Items.find(
        (item) => item.extensionId === extensionId && item.profile === profile
      );
    } else {
      awsIntegration = resp.Items.find(
        (item) => item.extensionId === extensionId && item.isDefault
      );
    }

    if (!awsIntegration) {
      awsIntegration = resp.Items.find(
        (item) => item.extensionId === extensionId
      );
    }

    if (!awsIntegration || awsIntegration?.profile !== profile) {
      throw new Error("You don't have the credentials");
    }

    // Decrypt using AWS Encryption SDK
    const { plaintext } = await decrypt(
      keyring,
      awsIntegration.secretAccessKey
    );

    // Create new AWS credentials object
    const credentials = new Credentials({
      accessKeyId: awsIntegration.accessKeyId,
      secretAccessKey: plaintext,
    });

    return credentials;
  };

  return {
    encrypt: async (secretAccessKey) => {
      return await encrypt(keyring, secretAccessKey, {
        encryptionContext: context,
      });
    },
    decrypt: async (key) => {
      return await decrypt(keyring, key);
    },
    getCredentials,
    generateApiKey,
    generateApiSecret,
  };
};

module.exports.cryptoV2 = cryptoV2;
