import { listEventByEmailAndWebsiteId } from "../../../adaptive-research/list-events-by-email-and-website-id.js";
import { FilterPeriod } from "../../../adaptive-research/utils.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getUserCredentialById } from "../../user-credentials/get-user-credential-by-id.api.js";

export const listEventByEmailAndWebsiteIdApi = async (params: {
  websiteId: string;
  period: FilterPeriod;
  from?: string;
  to?: string;
  email: string;
}) => {
  const { websiteId, period, from, to, email } = params;

  const website = await getUserCredentialById(websiteId);

  const timezoneName = website?.timezoneName || "America/Montreal";

  const events = await listEventByEmailAndWebsiteId({
    websiteId,
    clickHouseClient: clickhouseClient.client,
    period,
    from,
    to,
    email,
  });

  return events;
};
