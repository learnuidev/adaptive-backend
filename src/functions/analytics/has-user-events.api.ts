import { clickhouseClient } from "../../lib/clickhouse-client.js";
import { getUserWebsiteById } from "../user-websites/get-user-website-by-id.api.js";
import { listUserTeamMembershipsApi } from "../user-websites/list-user-team-memberships.api.js";

export const hasUserEventsApi = async ({
  websiteId,
  userId,
}: {
  websiteId: string;
  userId: string;
}) => {
  const userCredential = await getUserWebsiteById(websiteId);

  //
  const userMemberships = await listUserTeamMembershipsApi(userId);

  const isUserMember = userMemberships?.find(
    (membership) => membership.websiteId === websiteId
  );

  if (userCredential?.userId !== userId && !isUserMember) {
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
