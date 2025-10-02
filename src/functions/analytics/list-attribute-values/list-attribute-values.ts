import middy from "@middy/core";
import cors from "@middy/http-cors";

import { listMetadatasByWebsiteId } from "../../../adaptive-research/list-metadatas-by-website-id.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getUserCredentialById } from "../../user-credentials/get-user-credential-by-id.api.js";
import { listAttributeValues } from "../../../adaptive-research/list-attribute-values.js";

export const handler = middy(async (event: any) => {
  try {
    const { websiteId, attributeKey } = JSON.parse(event.body);

    const website = await getUserCredentialById(websiteId);

    const metadatas = await listAttributeValues({
      clickHouseClient: clickhouseClient.client,
      attributeKey,
      websiteId: website?.id,
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify(metadatas),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        // @ts-ignore
        message: err.message,
      }),
    };
    return response;
  }
}).use(cors());
