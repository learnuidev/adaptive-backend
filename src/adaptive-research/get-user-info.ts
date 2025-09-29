import { ClickHouseClient } from "@clickhouse/client";

import { FilterPeriod } from "./utils.js";

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

export const getUserInfo = async ({
  clickHouseClient,
  email,
  websiteId,
}: {
  clickHouseClient: ClickHouseClient;
  websiteId: string;
  email: string;
  period?: FilterPeriod;
}) => {
  console.log(`Listing events for email: ${email}, websiteId: ${websiteId}`);

  const query = `
    SELECT 
      country,
      region,
      city,
      created_at,
      session_id,
      os_name,
      os_version,
      browser_name,
      browser_version,
      device_vendor,
      device_model
    FROM event 
    WHERE email = '${email}' 
      AND website_id = '${websiteId}' 
    ORDER BY created_at DESC
  `;

  const resp = await clickHouseClient.query({
    query,
    format: "JSONEachRow",
  });
  const rows = await resp.json();

  if (!rows || rows.length === 0) {
    return {
      basicInformation: {
        location: "",
        lastSeen: "",
        firstVisit: "",
        totalPageViews: 0,
        totalSessions: 0,
        averageDuration: 0,
        status: "inactive",
      },
      devicesUsed: [],
    };
  }

  const firstVisit = rows[rows.length - 1].created_at;
  const lastSeen = rows[0].created_at;

  const uniqueSessions = new Set(rows.map((r: any) => r.session_id)).size;

  const location = `${rows[0].city}, ${rows[0].region}, ${rows[0].country}`;

  const deviceMap = new Map<string, number>();
  rows.forEach((r: any) => {
    const key = `${r.os_name}|${r.os_version}|${r.browser_name}|${r.browser_version}|${r.device_vendor}|${r.device_model}`;
    deviceMap.set(key, (deviceMap.get(key) || 0) + 1);
  });

  const totalEvents = rows.length;
  const devicesUsed = Array.from(deviceMap.entries()).map(([key, count]) => {
    const [
      os_name,
      os_version,
      browser_name,
      browser_version,
      device_vendor,
      device_model,
    ] = key.split("|");
    return {
      os_name,
      os_version,
      browser_name,
      browser_version,
      device_vendor,
      device_model,
      percentageUsed: Number(((count / totalEvents) * 100).toFixed(2)),
    };
  });

  const userInfo = {
    basicInformation: {
      location,
      lastSeen,
      firstVisit,
      totalPageViews: totalEvents,
      totalSessions: uniqueSessions,
      averageDuration: 0,
      status: "active",
    },
    devicesUsed,
  };

  return userInfo;
};
