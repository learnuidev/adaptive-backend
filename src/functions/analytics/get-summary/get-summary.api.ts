import {
  getTotalPageVisitsByWebsiteId,
  getTotalViewsByWebsiteId,
  getTotalVisitorsByGeo,
  listPagesByWebsiteId,
} from "../../../adaptive-research/events.js";
import { getTotalUniqueUsers } from "../../../adaptive-research/get-total-unique-users.js";
import { listVisitorsByWebsiteId } from "../../../adaptive-research/list-visitors-by-website-id.js";
import { FilterPeriod } from "../../../adaptive-research/utils.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";

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

export const getSummaryApi = async ({
  websiteId,
  period,
  from,
  to,
}: {
  websiteId: string;
  period: FilterPeriod;
  from?: string;
  to?: string;
}) => {
  const totalPageVisits = await getTotalPageVisitsByWebsiteId(
    clickhouseClient.client,
    websiteId,
    period,
    from,
    to
  );

  const pages = await listPagesByWebsiteId(clickhouseClient.client, websiteId);

  const totalVisitors = await getTotalUniqueUsers(
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

  return {
    pages,
    totalPageVisits,
    totalVisitors,
    visitors,
  };
};
