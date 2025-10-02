import { testClient } from "./test-client.mjs";

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

async function listAttributeValues({
  clickHouseClient,
  websiteId,
  attributeKey,
}) {
  const allowedKeys = [
    "id",
    "visitor_id",
    "session_id",
    "identity_id",
    "website_id",
    "type",
    "event_name",
    "content_id",
    "href",
    "domain",
    "created_at",
    "email",
    "ip_address",
    "country",
    "region",
    "city",
    "latitude",
    "longitude",
    "timezone",
    "os_name",
    "os_version",
    "browser_name",
    "browser_version",
    "device_vendor",
    "device_model",
    "viewport_width",
    "viewport_height",
  ];

  if (!allowedKeys.includes(attributeKey)) {
    throw new Error(`Invalid attributeKey: ${attributeKey}`);
  }

  const query = `
    SELECT DISTINCT
      CASE
        WHEN '${attributeKey}' = 'latitude' THEN toString(latitude)
        WHEN '${attributeKey}' = 'longitude' THEN toString(longitude)
        WHEN '${attributeKey}' = 'viewport_width' THEN toString(viewport_width)
        WHEN '${attributeKey}' = 'viewport_height' THEN toString(viewport_height)
        ELSE ${attributeKey}
      END AS value
    FROM event
    WHERE website_id = {websiteId:String}
      AND email IS NOT NULL
      AND ${attributeKey} IS NOT NULL
    ORDER BY value ASC
  `;

  const result = await clickHouseClient.query({
    query,
    query_params: { websiteId },
    format: "JSONEachRow",
  });

  const rows = await result.json();
  return rows.map((r) => r.value);
}

// ClickHouseError: There is no supertype for types String, String, String, String, String, String, String, String, String, String, DateTime64(3, 'UTC'), String, IPv4, String, String, String, String, String, String, String, String, String, String, String, String, String, String because some of them are String\/FixedString\/Enum and some of them are not: In scope SELECT arrayJoin(['id', 'visitor_id', 'session_id', 'identity_id', 'website_id', 'type', 'event_name', 'content_id', 'href', 'domain', 'created_at', 'email', 'ip_address', 'country', 'region', 'city', 'latitude', 'longitude', 'timezone', 'os_name', 'os_version', 'browser_name', 'browser_version', 'device_vendor', 'device_model', 'viewport_width', 'viewport_height']) AS key, caseWithExpression(key, 'id', id, 'visitor_id', visitor_id, 'session_id', session_id, 'identity_id', identity_id, 'website_id', website_id, 'type', type, 'event_name', event_name, 'content_id', content_id, 'href', href, 'domain', domain, 'created_at', created_at, 'email', email, 'ip_address', ip_address, 'country', country, 'region', region, 'city', city, 'latitude', toString(latitude), 'longitude', toString(longitude), 'timezone', timezone, 'os_name', os_name, 'os_version', os_version, 'browser_name', browser_name, 'browser_version', browser_version, 'device_vendor', device_vendor, 'device_model', device_model, 'viewport_width', toString(viewport_width), 'viewport_height', toString(viewport_height), NULL) AS value FROM event WHERE (website_id = '01K66XSK34CXMV0TT8ATS953W0') AND (email IS NOT NULL).
//     at parseError (/Users/vishalgamm/work/adaptive/adaptive-backend/node_modules/@clickhouse/client-common/dist/error/error.js:38:16)
//     at ClientRequest.onResponse (/Users/vishalgamm/work/adaptive/adaptive-backend/node_modules/@clickhouse/client/dist/connection/node_base_connection.js:443:107)
//     at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
//   code: '386',
//   type: 'NO_COMMON_TYPE'
// }

listAttributeValues({
  clickHouseClient: testClient,
  // websiteId: "01K66Y71NVHBWVFX8T9HB76WXH",
  websiteId: "01K66XSK34CXMV0TT8ATS953W0",
  attributeKey: "email",
}).then((resp) => {
  console.log(resp);
});
