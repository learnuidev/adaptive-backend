// import { clientTest } from './test-client.mjs'

import { testClient } from "./test-client.mjs";

const sample_events = {
  os_version: "10.15.7",
  ipAddress: "45.144.115.137",
  os_name: "macOS",
  device_model: "Macintosh",
  identityId: "01K646SNFB4JZSMBMR3QSJWVF6",
  browser_version: "140.0.0.0",
  email: "learnuidev@gmail.com",
  country: "US",
  city: "Ashburn",
  extraData: {
    contentid: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
    eventName: "content-viewed",
    email: "learnuidev@gmail.com",
  },
  href: "https://www.mandarino.io/convos",
  region: "VA",
  id: "01K646STTAYEA10JXAQX8FZB2K",
  latitude: 39.018,
  domain: "www.mandarino.io",
  visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
  createdAt: 1758930463562,
  sessionId: "sd54b5ada-f54b-46ba-89c9-7e820820ae65",
  browser_name: "Chrome",
  longitude: -77.539,
  websiteId: "mando-prod",
  device_vendor: "Apple",
  timezone: "America/New_York",
  type: "custom",
  viewport: {
    width: 342,
    height: 859,
  },
};

const listVisitorsByWebsiteId = async (clickHouseClient, websiteId) => {
  console.log(`Listing visitors for websiteId: ${websiteId}`);
  const resp = await clickHouseClient.query({
    query: `
      SELECT 
        DISTINCT visitor_id, 
        max(created_at) as last_seen,
        anyLast(email) as email,
        anyLast(country) as country,
        anyLast(region) as region,
        anyLast(city) as city
      FROM event
      WHERE website_id = '${websiteId}'
      GROUP BY visitor_id
      ORDER BY last_seen DESC
    `,
    format: "JSONEachRow",
  });
  return await resp.json();
};

listVisitorsByWebsiteId(
  testClient,

  "01K66Y71NVHBWVFX8T9HB76WXH"
).then((resp) => {
  console.log("YOO", resp);
});
