const { buildDateRange } = require("./utils");

/* eslint-disable no-unused-vars */
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
function mapDDBEvent(event) {
  return {
    id: event.id,
    visitor_id: event.visitorId,
    session_id: event.sessionId,
    identity_id: event.identityId,
    website_id: event.websiteId,
    type: event.type,
    event_name: event.extraData?.eventName,
    content_id: event.extraData?.contentid,
    href: event.href,
    domain: event.domain,
    created_at: event.createdAt,
    email: event.email,
    ip_address: event.ipAddress,
    country: event.country,
    region: event.region,
    city: event.city,
    latitude: event.latitude,
    longitude: event.longitude,
    timezone: event.timezone,
    os_name: event.os_name,
    os_version: event.os_version,

    browser_name: event.browser_name,
    browser_version: event.browser_version,

    device_vendor: event.device_vendor,
    device_model: event.device_model,
    viewport_width: event.viewport?.width,
    viewport_height: event.viewport?.height,
    metadata: event.extraData,
  };
}

const createEventTable = async (clickHouseClient) => {
  console.log(`Creating event table if not exists`);
  const resp = await clickHouseClient.query({
    query: `
CREATE TABLE IF NOT EXISTS event (
  id String,
  visitor_id String,
  session_id String,
  identity_id String,
  website_id LowCardinality(String),
  type LowCardinality(String),
  event_name String,
  content_id String,
  href String,
  domain String,
  created_at DateTime64(3, 'UTC'),
  email String,
  ip_address IPv4,
  country LowCardinality(String),
  region LowCardinality(String),
  city String,
  latitude Float64,
  longitude Float64,
  timezone LowCardinality(String),
  os_name LowCardinality(String),
  os_version String,
  browser_name LowCardinality(String),
  browser_version String,
  device_vendor LowCardinality(String),
  device_model String,
  viewport_width UInt16,
  viewport_height UInt16,
  metadata Map(String, String)
)
ENGINE = MergeTree
ORDER BY (website_id, created_at);
    `,
  });

  console.log(`Event table created`);

  return resp;
};

const getTotalVisitorsByGeo = async (
  clickHouseClient,
  websiteId,
  period,
  from,
  to
) => {
  const { start, previousStart } = buildDateRange(period, from, to);
  const current = await clickHouseClient.query({
    query: `
      SELECT
        country,
        region,
        city,
        COUNT(DISTINCT visitor_id) as visitors
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
      GROUP BY country, region, city
      ORDER BY visitors DESC
    `,
    format: "JSONEachRow",
  });
  const previous = await clickHouseClient.query({
    query: `
      SELECT
        country,
        region,
        city,
        COUNT(DISTINCT visitor_id) as visitors
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
      GROUP BY country, region, city
      ORDER BY visitors DESC
    `,
    format: "JSONEachRow",
  });
  return {
    current: await current.json(),
    previous: await previous.json(),
  };
};

const getTotalPageVisitsByWebsiteId = async (
  clickHouseClient,
  websiteId,
  period,
  from,
  to
) => {
  const { start, previousStart } = buildDateRange(period, from, to);
  const current = await clickHouseClient.query({
    query: `
      SELECT href, COUNT(*) as visits
      FROM event
      WHERE website_id = '${websiteId}'
        AND type = 'pageview'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
      GROUP BY href
      ORDER BY visits DESC
    `,
    format: "JSONEachRow",
  });
  const previous = await clickHouseClient.query({
    query: `
      SELECT href, COUNT(*) as visits
      FROM event
      WHERE website_id = '${websiteId}'
        AND type = 'pageview'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
      GROUP BY href
      ORDER BY visits DESC
    `,
    format: "JSONEachRow",
  });
  return {
    current: await current.json(),
    previous: await previous.json(),
  };
};
const getTotalViewsByWebsiteId = async (
  clickHouseClient,
  websiteId,
  period,
  from,
  to
) => {
  const { start, previousStart } = buildDateRange(period, from, to);

  console.log("START", start);
  console.log("previous start", previousStart);

  let currentQuery, previousQuery;

  // Determine grouping based on period
  if (period === "last24h") {
    // Group by hour for last 24 hours
    currentQuery = `
      SELECT toStartOfHour(created_at) as hour, COUNT(*) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
    previousQuery = `
      SELECT toStartOfHour(created_at) as hour, COUNT(*) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
  } else if (period === "week" || period === "month") {
    // Group by day for week or month
    currentQuery = `
      SELECT toDate(created_at) as day, COUNT(*) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
      GROUP BY day
      ORDER BY day ASC
    `;
    previousQuery = `
      SELECT toDate(created_at) as day, COUNT(*) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
      GROUP BY day
      ORDER BY day ASC
    `;
  } else if (period === "ytd" || period === "year") {
    // Group by month for year or ytd
    currentQuery = `
      SELECT toYYYYMM(created_at) as month, COUNT(*) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
      GROUP BY month
      ORDER BY month ASC
    `;
    previousQuery = `
      SELECT toYYYYMM(created_at) as month, COUNT(*) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
      GROUP BY month
      ORDER BY month ASC
    `;
  } else {
    // Default to total count for other periods
    currentQuery = `
      SELECT COUNT(*) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${start}'
        ${period === "custom" ? `AND created_at <= '${to.toISOString()}'` : ""}
    `;
    previousQuery = `
      SELECT COUNT(*) as total
      FROM event
      WHERE website_id = '${websiteId}'
        AND created_at >= '${previousStart}'
        AND created_at < '${start}'
    `;
  }

  const current = await clickHouseClient.query({
    query: currentQuery,
    format: "JSONEachRow",
  });
  const previous = await clickHouseClient.query({
    query: previousQuery,
    format: "JSONEachRow",
  });

  const curr = await current.json();
  const prev = await previous.json();

  return {
    current: curr,
    previous: prev,
  };
};

const cleanEventTable = async (clickHouseClient) => {
  console.log(`Cleaning all items from event table`);
  const resp = await clickHouseClient.query({
    query: `ALTER TABLE event DELETE WHERE 1=1`,
  });

  console.log(`Event table cleaned`);
  return resp;
};

const deleteEventTable = async (clickHouseClient) => {
  console.log(`Deleting event table`);
  const resp = await clickHouseClient.query({
    query: `DROP TABLE IF EXISTS event`,
  });

  console.log(`Event table deleted`);
  return resp;
};

const ingestDDBEvent = async (clickHouseClient, ddbEvent) => {
  console.log(`Ingesting single event record`);
  const row = mapDDBEvent(ddbEvent);

  // Check if event already exists
  const exists = await clickHouseClient.query({
    query: `SELECT count() as c FROM event WHERE id = '${row.id}'`,
    format: "JSONEachRow",
  });

  const result = await exists.json();
  if (result[0].c > 0) {
    console.log(`Event ${row.id} already exists, skipping insert`);
    return { skipped: true };
  }

  const resp = await clickHouseClient.insert({
    table: "event",
    values: [row],
    format: "JSONEachRow",
  });

  console.log(`Ingested event`, resp);
  return resp;
};

const ingestDDBEvents = async (clickHouseClient, dDBEvents) => {
  console.log(`Ingesting ${dDBEvents.length} event records`);
  const rows = dDBEvents.map(mapDDBEvent);

  // Fetch existing ids in one query
  const ids = rows.map((r) => `'${r.id}'`).join(",");
  const existingResp = await clickHouseClient.query({
    query: `SELECT id FROM event WHERE id IN (${ids})`,
    format: "JSONEachRow",
  });

  const existing = await existingResp.json();
  const existingIds = new Set(existing.map((r) => r.id));

  const toInsert = rows.filter((r) => !existingIds.has(r.id));

  if (toInsert.length === 0) {
    console.log(`All events already exist, skipping insert`);
    return { skipped: true };
  }

  const resp = await clickHouseClient.insert({
    table: "event",
    values: toInsert,
    format: "JSONEachRow",
  });

  console.log(`Ingested ${toInsert.length} new events`, resp);
  return resp;
};

const listEventsByWebsiteId = async (clickHouseClient, websiteId) => {
  console.log(`Listing events for websiteId: ${websiteId}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM event WHERE website_id = '${websiteId}' ORDER BY created_at DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

const listEventByEmail = async (clickHouseClient, email) => {
  console.log(`Listing events for email: ${email}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM event WHERE email = '${email}' ORDER BY created_at DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};
module.exports = {
  mapDDBEvent,
  createEventTable,
  cleanEventTable,
  deleteEventTable,
  ingestDDBEvent,
  ingestDDBEvents,
  listEventsByWebsiteId,
  listEventByEmail,

  // Queries
  getTotalVisitorsByGeo,
  getTotalViewsByWebsiteId,
  getTotalPageVisitsByWebsiteId,
};
