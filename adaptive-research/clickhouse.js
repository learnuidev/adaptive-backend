/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { createClient } = require("@clickhouse/client");
require("dotenv").config();

const mockIdentities = [
  {
    id: "01K62G9C3N08K319ERGX7G45J2",
    email: "learnuidev@gmail.com",
    ipAddress: "204.48.76.246",
    os_name: "iOS",
    os_version: "18.6.2",
    device_type: "mobile",
    device_model: "iPhone",
    device_vendor: "Apple",
    browser_name: "Mobile Safari",
    browser_major: "18",
    browser_version: "18.6",
    websiteId: "mando-prod",
    emailAndDeviceType:
      "learnuidev@gmail.com#iOS_18.6.2#iPhone_Apple#Mobile Safari_18.6#mando-prod",
    createdAt: "2025-09-26 07:55:01.109",
    updatedAt: "2025-09-26 14:10:33.523",
  },
  {
    id: "01K62G9PXWVAS1E2X75QY4S2JE",
    email: "learnuidev@gmail.com",
    ipAddress: "185.238.28.12",
    os_name: "macOS",
    os_version: "10.15.7",
    device_type: "",
    device_model: "Macintosh",
    device_vendor: "Apple",
    browser_name: "Chrome",
    browser_major: "140",
    browser_version: "140.0.0.0",
    websiteId: "mando-prod",
    emailAndDeviceType:
      "learnuidev@gmail.com#macOS_10.15.7#Macintosh_Apple#Chrome_140.0.0.0#mando-prod",
    createdAt: "1970-01-01 00:00:00.000",
    updatedAt: "1970-01-01 00:00:00.000",
  },
];

const mockEvents = [
  {
    id: "01K63CA2QE67376J99FE41QKFA",
    ipAddress: "192.226.184.176",
    href: "https://www.adaptive.fyi/",
    sessionId: "sea43d3cd-09f6-40a8-906a-8b40699168d6",
    websiteId: "adaptive",
    visitorId: "aecd7b27-cf35-49ac-806b-29f035917dd0",
    email: "learnuidev@gmail.com",
    viewportWidth: 1512,
    viewportHeight: 945,
    domain: "www.adaptive.fyi",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 16:04:44.398",
  },
  {
    id: "01K635S0GY3BNXRVJN7HBVBPGH",
    ipAddress: "204.48.76.246",
    href: "https://www.mandarino.io/",
    sessionId: "s383e9c87-f6b1-425c-ada9-eecc86c6bf67",
    websiteId: "mando-prod",
    visitorId: "a2acb54c-1686-4cd1-ad3e-8fd9eb0b4e8e",
    email: "learnuidev@gmail.com",
    viewportWidth: 390,
    viewportHeight: 663,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 14:10:33.631",
  },
  {
    id: "01K634VVQAGJB0GCKSECZRTD7B",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/convos/b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
    sessionId: "sd9130159-a125-400b-b138-a1691cabe4ce",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 1374,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "01K62G9PXWVAS1E2X75QY4S2JE",
    extraData: "",
    createdAt: "2025-09-26 13:54:38.442",
  },
  {
    id: "01K634VV98HSW1GZYHYKRBGFSR",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/convos",
    sessionId: "sd9130159-a125-400b-b138-a1691cabe4ce",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 1374,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "custom",
    identityId: "01K62G9PXWVAS1E2X75QY4S2JE",
    extraData:
      '{"contentid":"b3f8880b-def5-5ff7-97a0-cbab2b07b41d","eventName":"content-viewed","email":"learnuidev@gmail.com"}',
    createdAt: "2025-09-26 13:54:37.992",
  },
  {
    id: "01K634VNNPJQBR1V7G6NNZ5B4G",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/convos",
    sessionId: "sd9130159-a125-400b-b138-a1691cabe4ce",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 1374,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "01K62G9PXWVAS1E2X75QY4S2JE",
    extraData: "",
    createdAt: "2025-09-26 13:54:32.246",
  },
  {
    id: "01K634VNG43ZPXDXEEZ739G8MJ",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/convos",
    sessionId: "sd9130159-a125-400b-b138-a1691cabe4ce",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 1374,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "01K62G9PXWVAS1E2X75QY4S2JE",
    extraData: "",
    createdAt: "2025-09-26 13:54:32.068",
  },
  {
    id: "01K634VNEAD95NRJPFZVY16VPP",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/",
    sessionId: "sd9130159-a125-400b-b138-a1691cabe4ce",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 1374,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "01K62G9PXWVAS1E2X75QY4S2JE",
    extraData: "",
    createdAt: "2025-09-26 13:54:32.010",
  },
  {
    id: "01K634VKJYJXDHTEMHGMK6NYG1",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/",
    sessionId: "sd9130159-a125-400b-b138-a1691cabe4ce",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 1374,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 13:54:30.111",
  },
  {
    id: "01K62H7D2W7KSVQMQEFQP3RXQ2",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/",
    sessionId: "s4b0da34b-3aab-4f50-afb3-767179101e36",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 1374,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "01K62G9PXWVAS1E2X75QY4S2JE",
    extraData: "",
    createdAt: "2025-09-26 08:11:25.149",
  },
  {
    id: "01K62G9PYCFX8T4ZSRCAB0ECRN",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/",
    sessionId: "s4b0da34b-3aab-4f50-afb3-767179101e36",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 1374,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:55:12.204",
  },
  {
    id: "01K62G9CFTPJ6HKVTFE4DP7JAH",
    ipAddress: "192.226.184.176",
    href: "https://www.mandarino.io/",
    sessionId: "s329d3ae8-a573-4d01-ad28-d7e1e8840306",
    websiteId: "mando-prod",
    visitorId: "a2acb54c-1686-4cd1-ad3e-8fd9eb0b4e8e",
    email: "learnuidev@gmail.com",
    viewportWidth: 390,
    viewportHeight: 663,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:55:01.499",
  },
  {
    id: "01K62G9BZRSG6PC0HM1ZMVJE3G",
    ipAddress: "192.226.184.176",
    href: "https://www.mandarino.io/",
    sessionId: "s329d3ae8-a573-4d01-ad28-d7e1e8840306",
    websiteId: "mando-prod",
    visitorId: "a2acb54c-1686-4cd1-ad3e-8fd9eb0b4e8e",
    email: "learnuidev@gmail.com",
    viewportWidth: 390,
    viewportHeight: 663,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:55:00.984",
  },
  {
    id: "01K62G874JN3PBPNB5NPH7WPX1",
    ipAddress: "185.238.28.12",
    href: "https://www.adaptive.fyi/",
    sessionId: "s41d73f66-d747-4452-83eb-3aa129689f88",
    websiteId: "adaptive",
    visitorId: "aecd7b27-cf35-49ac-806b-29f035917dd0",
    email: "learnuidev@gmail.com",
    viewportWidth: 376,
    viewportHeight: 945,
    domain: "www.adaptive.fyi",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:54:23.251",
  },
  {
    id: "01K62G5A42P31J8TSHRXZ08D3M",
    ipAddress: "185.238.28.12",
    href: "https://www.adaptive.fyi/",
    sessionId: "s41d73f66-d747-4452-83eb-3aa129689f88",
    websiteId: "adaptive",
    visitorId: "aecd7b27-cf35-49ac-806b-29f035917dd0",
    email: "learnuidev@gmail.com",
    viewportWidth: 376,
    viewportHeight: 945,
    domain: "www.adaptive.fyi",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:52:48.002",
  },
  {
    id: "01K62G26R62C5762DM8A3JJXZM",
    ipAddress: "185.238.28.12",
    href: "https://www.adaptive.fyi/",
    sessionId: "s41d73f66-d747-4452-83eb-3aa129689f88",
    websiteId: "adaptive",
    visitorId: "aecd7b27-cf35-49ac-806b-29f035917dd0",
    email: "learnuidev@gmail.com",
    viewportWidth: 376,
    viewportHeight: 945,
    domain: "www.adaptive.fyi",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:51:06.247",
  },
  {
    id: "01K62FHR76G13DBWRRAS4DZ9SE",
    ipAddress: "192.226.184.176",
    href: "https://www.mandarino.io/",
    sessionId: "s329d3ae8-a573-4d01-ad28-d7e1e8840306",
    websiteId: "mando-prod",
    visitorId: "a2acb54c-1686-4cd1-ad3e-8fd9eb0b4e8e",
    email: "learnuidev@gmail.com",
    viewportWidth: 390,
    viewportHeight: 663,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:42:07.079",
  },
  {
    id: "01K62FHCC7ZSE8X5TZETACKT9M",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/apps",
    sessionId: "s4b0da34b-3aab-4f50-afb3-767179101e36",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 342,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:41:54.951",
  },
  {
    id: "01K62FGWDMQJXMTTQ7AQ2E6V34",
    ipAddress: "185.238.28.12",
    href: "https://www.adaptive.fyi/",
    sessionId: "s41d73f66-d747-4452-83eb-3aa129689f88",
    websiteId: "adaptive",
    visitorId: "aecd7b27-cf35-49ac-806b-29f035917dd0",
    email: "learnuidev@gmail.com",
    viewportWidth: 376,
    viewportHeight: 945,
    domain: "www.adaptive.fyi",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:41:38.612",
  },
  {
    id: "01K62F8QS4SZ3K3F9M00AFGC5F",
    ipAddress: "192.226.184.176",
    href: "https://www.mandarino.io/",
    sessionId: "s329d3ae8-a573-4d01-ad28-d7e1e8840306",
    websiteId: "mando-prod",
    visitorId: "a2acb54c-1686-4cd1-ad3e-8fd9eb0b4e8e",
    email: "learnuidev@gmail.com",
    viewportWidth: 390,
    viewportHeight: 663,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:37:11.716",
  },
  {
    id: "01K62F8KZXX1AR46FFT9ACDV57",
    ipAddress: "192.226.184.176",
    href: "https://www.mandarino.io/convos/dc218320-6f2f-5141-9869-64a11cf6d761",
    sessionId: "s329d3ae8-a573-4d01-ad28-d7e1e8840306",
    websiteId: "mando-prod",
    visitorId: "a2acb54c-1686-4cd1-ad3e-8fd9eb0b4e8e",
    email: "learnuidev@gmail.com",
    viewportWidth: 390,
    viewportHeight: 663,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "01K626J5XZ18BFSHNE6Z5J0JVM",
    extraData: "",
    createdAt: "2025-09-26 07:37:07.837",
  },
  {
    id: "01K62F7CGPJM4G19BMAB0DM6PX",
    ipAddress: "185.238.28.12",
    href: "https://www.adaptive.fyi/",
    sessionId: "s41d73f66-d747-4452-83eb-3aa129689f88",
    websiteId: "adaptive",
    visitorId: "aecd7b27-cf35-49ac-806b-29f035917dd0",
    email: "learnuidev@gmail.com",
    viewportWidth: 376,
    viewportHeight: 945,
    domain: "www.adaptive.fyi",
    type: "pageview",
    identityId: "01K62F4NNDDMKE4PGN0RZTHSW6",
    extraData: "",
    createdAt: "2025-09-26 07:36:27.414",
  },
  {
    id: "01K62F6HE7ZAK3MVV6X6NXTBYQ",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/apps",
    sessionId: "s4b0da34b-3aab-4f50-afb3-767179101e36",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 342,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "01K62F4NNDDMKE4PGN0RZTHSW6",
    extraData: "",
    createdAt: "2025-09-26 07:35:59.687",
  },
  {
    id: "01K62F6HAQ9YXAM1BA9Y11GNKK",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/apps",
    sessionId: "s4b0da34b-3aab-4f50-afb3-767179101e36",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 342,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "01K62F4NNDDMKE4PGN0RZTHSW6",
    extraData: "",
    createdAt: "2025-09-26 07:35:59.575",
  },
  {
    id: "01K62F55W3GED70A4NXAVMSGRB",
    ipAddress: "185.238.28.12",
    href: "https://www.mandarino.io/",
    sessionId: "s4b0da34b-3aab-4f50-afb3-767179101e36",
    websiteId: "mando-prod",
    visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
    email: "learnuidev@gmail.com",
    viewportWidth: 342,
    viewportHeight: 859,
    domain: "www.mandarino.io",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:35:15.075",
  },
  {
    id: "01K62F03F08RAAY2G30XJB3DKT",
    ipAddress: "185.238.28.12",
    href: "https://www.adaptive.fyi/",
    sessionId: "s41d73f66-d747-4452-83eb-3aa129689f88",
    websiteId: "adaptive",
    visitorId: "aecd7b27-cf35-49ac-806b-29f035917dd0",
    email: "learnuidev@gmail.com",
    viewportWidth: 376,
    viewportHeight: 945,
    domain: "www.adaptive.fyi",
    type: "pageview",
    identityId: "",
    extraData: "",
    createdAt: "2025-09-26 07:32:28.769",
  },
];

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

// Query Functions

// i. Total views by websiteId
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
      SELECT toStartOfHour(createdAt) as hour, COUNT(*) as total
      FROM event
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${start}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
    previousQuery = `
      SELECT toStartOfHour(createdAt) as hour, COUNT(*) as total
      FROM event
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${previousStart}'
        AND createdAt < '${start}'
      GROUP BY hour
      ORDER BY hour ASC
    `;
  } else if (period === "week" || period === "month") {
    // Group by day for week or month
    currentQuery = `
      SELECT toDate(createdAt) as day, COUNT(*) as total
      FROM event
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${start}'
        ${period === "custom" ? `AND createdAt <= '${to.toISOString()}'` : ""}
      GROUP BY day
      ORDER BY day ASC
    `;
    previousQuery = `
      SELECT toDate(createdAt) as day, COUNT(*) as total
      FROM event
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${previousStart}'
        AND createdAt < '${start}'
      GROUP BY day
      ORDER BY day ASC
    `;
  } else if (period === "ytd" || period === "year") {
    // Group by month for year or ytd
    currentQuery = `
      SELECT toYYYYMM(createdAt) as month, COUNT(*) as total
      FROM event
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${start}'
        ${period === "custom" ? `AND createdAt <= '${to.toISOString()}'` : ""}
      GROUP BY month
      ORDER BY month ASC
    `;
    previousQuery = `
      SELECT toYYYYMM(createdAt) as month, COUNT(*) as total
      FROM event
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${previousStart}'
        AND createdAt < '${start}'
      GROUP BY month
      ORDER BY month ASC
    `;
  } else {
    // Default to total count for other periods
    currentQuery = `
      SELECT COUNT(*) as total
      FROM event
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${start}'
        ${period === "custom" ? `AND createdAt <= '${to.toISOString()}'` : ""}
    `;
    previousQuery = `
      SELECT COUNT(*) as total
      FROM event
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${previousStart}'
        AND createdAt < '${start}'
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

// ii. Total page visits by websiteId
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
      WHERE websiteId = '${websiteId}'
        AND type = 'pageview'
        AND createdAt >= '${start}'
        ${period === "custom" ? `AND createdAt <= '${to.toISOString()}'` : ""}
      GROUP BY href
      ORDER BY visits DESC
    `,
    format: "JSONEachRow",
  });
  const previous = await clickHouseClient.query({
    query: `
      SELECT href, COUNT(*) as visits
      FROM event
      WHERE websiteId = '${websiteId}'
        AND type = 'pageview'
        AND createdAt >= '${previousStart}'
        AND createdAt < '${start}'
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

// iii. Total visitors by websiteId by country, region, city
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
        geo.country,
        geo.region,
        geo.city,
        COUNT(DISTINCT visitorId) as visitors
      FROM event
      ARRAY JOIN geo
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${start}'
        ${period === "custom" ? `AND createdAt <= '${to.toISOString()}'` : ""}
      GROUP BY geo.country, geo.region, geo.city
      ORDER BY visitors DESC
    `,
    format: "JSONEachRow",
  });
  const previous = await clickHouseClient.query({
    query: `
      SELECT
        geo.country,
        geo.region,
        geo.city,
        COUNT(DISTINCT visitorId) as visitors
      FROM event
      ARRAY JOIN geo
      WHERE websiteId = '${websiteId}'
        AND createdAt >= '${previousStart}'
        AND createdAt < '${start}'
      GROUP BY geo.country, geo.region, geo.city
      ORDER BY visitors DESC
    `,
    format: "JSONEachRow",
  });
  return {
    current: await current.json(),
    previous: await previous.json(),
  };
};

const formatDateForClickHouse = (date) => {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
};

// Helper to build date ranges
function buildDateRange(period, from, to) {
  const now = new Date();
  let start, previousStart;
  switch (period) {
    case "last24h":
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "day":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      const weekStart = now.getDate() - now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), weekStart);
      previousStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      break;
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      break;
    case "wtd":
      const wtdStart = now.getDate() - now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), wtdStart);
      previousStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      start = new Date(0);
      previousStart = new Date(0);
      break;
    case "custom":
      start = new Date(from);
      previousStart = new Date(
        from.getTime() - (to.getTime() - from.getTime())
      );
      break;
    default:
      throw new Error("Invalid period");
  }

  return {
    start: formatDateForClickHouse(start),
    previousStart: formatDateForClickHouse(previousStart),
  };
}

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
    // Query Functions
    getTotalViewsByWebsiteId,
    getTotalPageVisitsByWebsiteId,
    getTotalVisitorsByGeo,
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

  // const learnuiEvents = await listEventByEmail(client, "learnuidev@gmail.com");
  // console.log("learnuiEvents", learnuiEvents);

  // const totalViews = await getTotalViewsByWebsiteId(
  //   client,
  //   "mando-prod",
  //   "year"
  // );
  //   console.log("totalViews", totalViews);

  // const totalPageVisits = await getTotalPageVisitsByWebsiteId(
  //   client,
  //   "mando-prod",
  //   "month"
  // );

  // console.log("total page visits", totalPageVisits);

  // Errors out
  // const geoVisits = await getTotalVisitorsByGeo(client, "mando-prod", "month");
  // console.log("geoVisits", geoVisits);
});
