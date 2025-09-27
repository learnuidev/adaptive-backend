export const sample_identity = {
  os_version: "10.15.7",
  ipAddress: "45.144.115.137",
  os_name: "macOS",
  device_model: "Macintosh",
  createdAt: 1758930458092,
  browser_version: "140.0.0.0",
  email: "learnuidev@gmail.com",
  country: "US",
  city: "Ashburn",
  browser_name: "Chrome",
  longitude: -77.539,
  websiteId: "mando-prod",
  device_vendor: "Apple",
  timezone: "America/New_York",
  region: "VA",
  id: "01K646SNFB4JZSMBMR3QSJWVF6",
  latitude: 39.018,
  emailAndDeviceType:
    "learnuidev@gmail.com#macOS_10.15.7#Macintosh_Apple#Chrome_140.0.0.0#mando-prod",
};
export function mapDDBIdentity(identity) {
  return {
    id: identity.id || "",
    email: identity.email || "",
    ip_address: identity.ipAddress || "",
    os_name: identity.os_name || "",
    os_version: identity.os_version || "",
    device_model: identity.device_model || "",
    device_vendor: identity.device_vendor || "",
    browser_name: identity.browser_name || "",
    browser_version: identity.browser_version || "",
    website_id: identity.websiteId || "",
    email_and_device_type: identity.emailAndDeviceType,
    created_at: identity.createdAt,
    updated_at: identity.updatedAt,
    country: identity.country,
    city: identity.city,
    region: identity.region,
    latitude: identity.latitude,
    longitude: identity.longitude,
    timezone: identity.timezone,
    metadata: identity.metadata,
  };
}

// identity
export const createIdentityTable = async (clickHouseClient) => {
  console.log(`Creating identity table if not exists`);
  const resp = await clickHouseClient.query({
    query: `
      CREATE TABLE IF NOT EXISTS identity (
        id String,
        email String,
        ip_address IPv4,

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
        website_id LowCardinality(String),
        email_and_device_type String,

        metadata Map(String, String),

        created_at DateTime64(3, 'UTC'), -- millisecond precision timestamp
        updated_at DateTime64(3, 'UTC')
      )
      ENGINE = MergeTree
      ORDER BY (email, website_id, created_at);
    `,
  });

  console.log(`Identity table created`);

  return resp;
};

export const cleanIdentityTable = async (clickHouseClient) => {
  console.log(`Cleaning all items from identity table`);
  const resp = await clickHouseClient.query({
    query: `ALTER TABLE identity DELETE WHERE 1=1`,
  });

  console.log(`Identity table cleaned`);
  return resp;
};

export const deleteIdentityTable = async (clickHouseClient) => {
  console.log(`Deleting identity table`);
  const resp = await clickHouseClient.query({
    query: `DROP TABLE IF EXISTS identity`,
  });

  console.log(`Identity table deleted`);
  return resp;
};

export const listIdentitiesByWebsiteId = async (
  clickHouseClient,
  websiteId
) => {
  console.log(`Listing identities for websiteId: ${websiteId}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM identity WHERE website_id = '${websiteId}' ORDER BY created_at DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const listIdentitiesByEmail = async (clickHouseClient, email) => {
  console.log(`Listing identities for email: ${email}`);
  const resp = await clickHouseClient.query({
    query: `SELECT * FROM identity WHERE email = '${email}' ORDER BY created_at DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const ingestDDBIdentity = async (clickHouseClient, ddbIdentity) => {
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

export const ingestDDBIdentities = async (clickHouseClient, dDBIdentities) => {
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
