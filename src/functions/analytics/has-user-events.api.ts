import { clickhouseClient } from "../../lib/clickhouse-client.js";
import { getUserWebsiteById } from "../user-websites/get-user-website-by-id.api.js";

export const hasUserEventsApi = async ({
  websiteId,
  userId,
}: {
  websiteId: string;
  userId: string;
}) => {
  const userCredential = await getUserWebsiteById(websiteId);

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
