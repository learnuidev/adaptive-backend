import {
  listJourneyByEventAndWebsiteId,
  ListJourneysByEventAndWebsiteIdInput,
} from "../../../adaptive-research/list-journeys-by-event-and-website-id.js";
// import { getTotalVisitorTrafficByWebsiteId } from "../../../adaptive-research/get-total-visitor-traffic-by-website.js";
import { FilterPeriod } from "../../../adaptive-research/utils.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getUserWebsiteById } from "../../user-websites/get-user-website-by-id.api.js";

export const listJourneysApi = async (
  params: ListJourneysByEventAndWebsiteIdInput
) => {
  const { websiteId, eventId, goalName, selectedKeys } = params;

  const website = await getUserWebsiteById(websiteId);

  if (!website) {
    throw new Error("Website not found");
  }

  const journeys = await listJourneyByEventAndWebsiteId({
    clickHouseClient: clickhouseClient.client,
    websiteId: website?.id,
    eventId,
    goalName,
    selectedKeys,
  });

  return journeys;
};
