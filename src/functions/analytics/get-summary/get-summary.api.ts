import { getAverageSessionByWebsiteId } from "../../../adaptive-research/get-average-session-by-website-id.js";
import { getTotalPageVisitsByWebsiteId } from "../../../adaptive-research/get-total-page-visits-by-website-id.js";
import { getTotalPageVisitsTrafficByWebsiteId } from "../../../adaptive-research/get-total-page-visits-traffic-by-website-id.js";
import { getTotalUniqueUsers } from "../../../adaptive-research/get-total-unique-users.js";
// import { getTotalVisitorTrafficByWebsiteId } from "../../../adaptive-research/get-total-visitor-traffic-by-website.js";
import { listPagesByWebsiteId } from "../../../adaptive-research/list-pages-by-website-id.js";
import { listVisitorsByWebsiteId } from "../../../adaptive-research/list-visitors-by-website-id.js";
import { FilterPeriod } from "../../../adaptive-research/utils.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getUserCredentialById } from "../../user-credentials/get-user-credential-by-id.api.js";

// type GetSummaryRequest =
//   | {
//       website_id: string;
//       period: FilterPeriod;
//       granularity: "hourly" | "daily" | "weekly" | "monthly";
//       filter_country: string;
//     }
//   | {
//       website_id: string;
//       period: "custom";
//       granularity: "hourly" | "daily" | "weekly" | "monthly";
//       from: string;
//       to: string;
//       filter_country: string;
//     };

export const getSummaryApi = async (params: {
  websiteId: string;
  period: FilterPeriod;
  from?: string;
  to?: string;
}) => {
  const { websiteId, period, from, to } = params;

  const website = await getUserCredentialById(websiteId);

  const timezoneName = website?.timezoneName || "America/Montreal";

  const totalPageVisits = await getTotalPageVisitsByWebsiteId({
    clickHouseClient: clickhouseClient.client,
    timezoneName,
    websiteId: websiteId,
    period: period,
    from: from,
    to: to,
  });

  const averageSession = await getAverageSessionByWebsiteId({
    clickHouseClient: clickhouseClient.client,
    timezoneName,
    websiteId: websiteId,
    period: period,
    from: from,
    to: to,
  });

  const pages = await listPagesByWebsiteId(clickhouseClient.client, websiteId);

  const totalVisitors = await getTotalUniqueUsers(
    clickhouseClient.client,
    websiteId,
    period,
    from,
    to
  );

  const totalPageVisitsOvertime = await getTotalPageVisitsTrafficByWebsiteId(
    clickhouseClient.client,
    websiteId,
    period,
    from,
    to
  );

  const visitors = await listVisitorsByWebsiteId(
    clickhouseClient.client,
    websiteId
  );

  // const totalVisitorTraffic = await getTotalVisitorTrafficByWebsiteId(
  //   clickhouseClient.client,
  //   websiteId,
  //   period,
  //   from,
  //   to
  // );

  return {
    pages,
    totalPageVisits,
    totalVisitors,
    visitors,
    averageSession,
    totalPageVisitsOvertime,
    // totalVisitorTraffic,
  };
};
