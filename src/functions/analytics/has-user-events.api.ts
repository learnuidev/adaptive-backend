import { clickhouseClient } from "../../lib/clickhouse-client.js";
import { getUserCredentialById } from "../user-credentials/get-user-credential-by-id.api.js";

export const hasUserEventsApi = async ({
  websiteId,
  userId,
}: {
  websiteId: string;
  userId: string;
}) => {
  const userCredential = await getUserCredentialById(websiteId);

  if (userCredential?.userId !== userId) {
    return null;
  }

  if (clickhouseClient) {
    const hasUserEvents = await clickhouseClient.hasUserEvents(
      clickhouseClient.client,
      websiteId
    );
    return {
      hasUserEvents,
    };
  }
};
