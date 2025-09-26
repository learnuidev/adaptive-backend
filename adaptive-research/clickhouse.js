/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { createClient } = require("@clickhouse/client");
require("dotenv").config();

// Helper to ingest event data into ClickHouse
function mapDDBEvent(event) {
  return {
    id: event.id || "",
    ipAddress: event.ipAddress || "",
    href: event.href || "",
    sessionId: event.sessionId || "",
    websiteId: event.websiteId || "",
    visitorId: event.visitorId || "",
    email: event.email || "",
    viewportWidth: event.viewport?.width || 0,
    viewportHeight: event.viewport?.height || 0,
    domain: event.domain || "",
    type: event.type || "",
    identityId: event.identityId || "",
    extraData: event.extraData ? JSON.stringify(event.extraData) : "",
    createdAt: event.createdAt,
  };
}

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

// event
const createEventTable = async (clickHouseClient) => {
  console.log(`Creating event table if not exists`);
  const resp = await clickHouseClient.query({
    query: `
      CREATE TABLE IF NOT EXISTS event (
        id String,
        ipAddress IPv4,
        href String,
        sessionId String,
        websiteId LowCardinality(String),
        visitorId String,
        email String,
        viewportWidth UInt16,
        viewportHeight UInt16,
        domain String,
        type LowCardinality(String),
        identityId String,
        extraData String,
        createdAt DateTime64(3, 'UTC')
      )
      ENGINE = MergeTree
      ORDER BY (websiteId, createdAt);
    `,
  });

  console.log(`Event table created`);

  return resp;
};

const cleanEventTable = async (clickHouseClient) => {
  console.log(`Cleaning all items from event table`);
  const resp = await clickHouseClient.query({
    query: `ALTER TABLE event DELETE WHERE 1=1`,
  });

  console.log(`Event table cleaned`);
  return resp;
};

const listEventsByWebsiteId = async (clickHouseClient, websiteId) => {
  console.log(`Listing events for websiteId: ${websiteId}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM event WHERE websiteId = '${websiteId}' ORDER BY createdAt DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

const listEventByEmail = async (clickHouseClient, email) => {
  console.log(`Listing events for email: ${email}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM event WHERE email = '${email}' ORDER BY createdAt DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

// Helper to ingest identity data into ClickHouse
function mapDDBIdentity(identity) {
  return {
    id: identity.id || "",
    email: identity.email || "",
    ipAddress: identity.ipAddress || "",
    os_name: identity.userAgentInfo.os.name || "",
    os_version: identity.userAgentInfo.os.version || "",
    device_type: identity.userAgentInfo.device.type || "",
    device_model: identity.userAgentInfo.device.model || "",
    device_vendor: identity.userAgentInfo.device.vendor || "",
    browser_name: identity.userAgentInfo.browser.name || "",
    browser_major: identity.userAgentInfo.browser.major || "",
    browser_version: identity.userAgentInfo.browser.version || "",
    websiteId: identity.websiteId || "",
    emailAndDeviceType: identity.emailAndDeviceType,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt,
  };
}

const ingestDDBIdentity = async (clickHouseClient, ddbIdentity) => {
  console.log(`Ingesting single identity record`);
  const row = mapDDBIdentity(ddbIdentity);

  // Check if identity already exists
  const exists = await clickHouseClient.query({
    query: `SELECT count() as c FROM identity WHERE id = '${row.id}'`,
    format: "JSONEachRow",
  });

  const result = await exists.json();
  if (result[0].c > 0) {
    console.log(`Identity ${row.id} already exists, skipping insert`);
    return { skipped: true };
  }

  const resp = await clickHouseClient.insert({
    table: "identity",
    values: [row],
    format: "JSONEachRow",
  });

  console.log(`Ingested identity`, resp);
  return resp;
};

const ingestDDBIdentities = async (clickHouseClient, dDBIdentities) => {
  console.log(`Ingesting ${dDBIdentities.length} identity records`);
  const rows = dDBIdentities.map(mapDDBIdentity);

  // Fetch existing ids in one query
  const ids = rows.map((r) => `'${r.id}'`).join(",");
  const existingResp = await clickHouseClient.query({
    query: `SELECT id FROM identity WHERE id IN (${ids})`,
    format: "JSONEachRow",
  });

  const existing = await existingResp.json();
  const existingIds = new Set(existing.map((r) => r.id));

  const toInsert = rows.filter((r) => !existingIds.has(r.id));

  if (toInsert.length === 0) {
    console.log(`All identities already exist, skipping insert`);
    return { skipped: true };
  }

  const resp = await clickHouseClient.insert({
    table: "identity",
    values: toInsert,
    format: "JSONEachRow",
  });

  console.log(`Ingested ${toInsert.length} new identities`, resp);
  return resp;
};

// identity
const createIdentityTable = async (clickHouseClient) => {
  console.log(`Creating identity table if not exists`);
  const resp = await clickHouseClient.query({
    query: `
      CREATE TABLE IF NOT EXISTS identity (
        id String,
        email String,
        ipAddress IPv4,

        -- OS info
        os_name String,
        os_version String,

        -- Device info
        device_type LowCardinality(String) DEFAULT '',
        device_model String,
        device_vendor String,

        -- Browser info
        browser_name String,
        browser_major String,
        browser_version String,

        -- Metadata
        websiteId LowCardinality(String),
        emailAndDeviceType String,

        createdAt DateTime64(3, 'UTC'), -- millisecond precision timestamp
        updatedAt DateTime64(3, 'UTC')
      )
      ENGINE = MergeTree
      ORDER BY (email, websiteId, createdAt);
    `,
  });

  console.log(`Identity table created`);

  return resp;
};

const cleanIdentityTable = async (clickHouseClient) => {
  console.log(`Cleaning all items from identity table`);
  const resp = await clickHouseClient.query({
    query: `ALTER TABLE identity DELETE WHERE 1=1`,
  });

  console.log(`Identity table cleaned`);
  return resp;
};

const listIdentitiesByWebsiteId = async (clickHouseClient, websiteId) => {
  console.log(`Listing identities for websiteId: ${websiteId}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM identity WHERE websiteId = '${websiteId}' ORDER BY createdAt DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

const listIdentitiesByEmail = async (clickHouseClient, email) => {
  console.log(`Listing identities for email: ${email}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM identity WHERE email = '${email}' ORDER BY createdAt DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

const clickhouse = async (params) => {
  const client = createClient(params);

  //   run migrations
  console.log("client generated");

  // Migrations
  await createIdentityTable(client);
  await createEventTable(client);

  return {
    client,
    // Identity
    createIdentityTable,
    ingestDDBIdentities,
    ingestDDBIdentity,
    mapDDBIdentity,
    cleanIdentityTable,
    listIdentitiesByWebsiteId,
    listIdentitiesByEmail,
    // Event
    createEventTable,
    ingestDDBEvents,
    ingestDDBEvent,
    mapDDBEvent,
    cleanEventTable,
    listEventsByWebsiteId,
    listEventByEmail,
  };
};

// testing

const params = {
  url: process.env.CLICKHOUSE_URL,
  username: process.env.CLICKHOUSE_USERNAME,
  password: process.env.CLICKHOUSE_PASSWORD,
};

// Manual Testing
clickhouse(params).then(async (resp) => {
  const {
    client,
    ingestDDBIdentities,
    cleanIdentityTable,
    ingestDDBEvents,
    cleanEventTable,
  } = resp;

  // await ingestDDBIdentities(client, mockIdentities);
  // await cleanIdentityTable(client);

  // const identities = await listIdentitiesByWebsiteId(client, "mando-prod");
  // console.log("identities", identities);

  // const identities = await listIdentitiesByEmail(client, "learnuidev@gmail.com");
  // console.log("identities", identities);

  // await ingestDDBEvents(client, mockEvents);
  // await cleanEventTable(client);

  // const events = await listEventsByWebsiteId(client, "mando-prod");
  // console.log("events", events);

  // const events = await listEventByEmail(client, "learnuidev@gmail.com");
  // console.log("events", events);

  // console.log("client", client);

  // await ingestDDBEvents(client, mockEvents);

  const learnuiEvents = await listEventByEmail(client, "learnuidev@gmail.com");
  console.log("learnuiEvents", learnuiEvents);
});
