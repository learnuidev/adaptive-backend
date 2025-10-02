import { ClickHouseClient } from "@clickhouse/client";

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

export async function listAttributeValues({
  clickHouseClient,
  websiteId,
  attributeKey,
}: {
  clickHouseClient: ClickHouseClient;
  websiteId: string;
  attributeKey: string;
}): Promise<string[]> {
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

  const rows = (await result.json()) as { value: string }[];
  return rows.map((r) => r.value) as string[];
}
