import middy from "@middy/core";
import cors from "@middy/http-cors";

import { listMetadatasByWebsiteId } from "../../../adaptive-research/list-metadatas-by-website-id.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getUserCredentialById } from "../../user-credentials/get-user-credential-by-id.api.js";

export const handler = middy(async (event) => {
  try {
    const { websiteId } = JSON.parse(event.body);

    const website = await getUserCredentialById(websiteId);

    const metadatas = await listMetadatasByWebsiteId({
      clickHouseClient: clickhouseClient.client,

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
        message: err.message,
      }),
    };
    return response;
  }
}).use(cors());
