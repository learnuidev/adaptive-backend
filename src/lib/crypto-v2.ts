import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import { ulid } from "ulid";

import {
  KmsKeyringNode,
  buildClient,
  CommitmentPolicy,
} from "@aws-crypto/client-node";
import { apiConfig } from "../constants/api-config.js";

const { encrypt, decrypt } = buildClient(
  CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
);

const context = {
  stage: "dev",
  purpose: "Decrypting AWS Client Secret",
  origin: apiConfig.region,
};

export const API_SECRET_LENGTH = 64;
export const API_KEY_LENGTH = 26;

export function generateApiKey() {
  return ulid();
}

export function generateApiSecret(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

export const cryptoV2 = ({ keyArn }: { keyArn: string }) => {
  const generatorKeyId = keyArn;
  const keyIds = [keyArn];

  const keyring = new KmsKeyringNode({ generatorKeyId, keyIds });

  // DynamoDB v3 client setup
  const ddbClient = new DynamoDBClient({ region: apiConfig.region });
  const dynamodb = DynamoDBDocumentClient.from(ddbClient);

  return {
    encrypt: async (secretAccessKey: string) => {
      return await encrypt(keyring, secretAccessKey, {
        encryptionContext: context,
      });
    },
    decrypt: async (key: string) => {
      return await decrypt(keyring, key);
    },
  };
};
