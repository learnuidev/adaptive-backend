import { ClickHouseClient } from "@clickhouse/client";
import { formatDateForClickHouse } from "./utils.js";

import { buildDateRange, FilterPeriod } from "./utils.js";

const sample_clickhouse_event = {
  id: "01K646STTAYEA10JXAQX8FZB2K",
  visitor_id: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
  session_id: "sd54b5ada-f54b-46ba-89c9-7e820820ae65",
  identity_id: "01K646SNFB4JZSMBMR3QSJWVF6",
  website_id: "mando-prod",
  type: "custom",
  event_name: "content-viewed",
  content_id: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
  href: "https://www.mandarino.io/convos",
  domain: "www.mandarino.io",
  created_at: "2025-09-28 05:59:48.290",
  email: "learnuidev@gmail.com",
  ip_address: "45.144.115.137",
  country: "US",
  region: "VA",
  city: "Ashburn",
  latitude: 39.018,
  longitude: -77.539,
  timezone: "America/New_York",
  os_name: "macOS",
  os_version: "10.15.7",
  browser_name: "Chrome",
  browser_version: "140.0.0.0",
  device_vendor: "Apple",
  device_model: "Macintosh",
  viewport_width: 342,
  viewport_height: 859,
  metadata: {
    contentid: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
    eventName: "content-viewed",
    email: "learnuidev@gmail.com",
  },
};

export const listEventByEmailAndWebsiteId = async ({
  clickHouseClient,
  email,
  websiteId,
  period,
  from,
  to,
}: {
  clickHouseClient: ClickHouseClient;
  websiteId: string;
  period: FilterPeriod;
  from?: string;
  to?: string;
  email: string;
}) => {
  const { startStart, startEnd } = buildDateRange({ period, from, to });

  console.log(
    `Listing events for email: ${email}, websiteId: ${websiteId}, period: ${period}, from: ${startStart}, to: ${startEnd}`
  );

  const query = `
    SELECT * 
    FROM event 
    WHERE email = '${email}' 
      AND website_id = '${websiteId}' 
      AND created_at >= '${startStart}' 
      AND created_at <= '${startEnd}' 
    ORDER BY created_at DESC
  `;

  const resp = await clickHouseClient.query({
    query,
    format: "JSONEachRow",
  });
  return await resp.json();
};
