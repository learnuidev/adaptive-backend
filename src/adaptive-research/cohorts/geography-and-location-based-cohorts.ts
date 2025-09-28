export const getUsersByRegion = async (
  clickHouseClient,
  website_id,
  region,
  days = 30
) => {
  console.log(`Getting users in region: ${region} for website: ${website_id}`);
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              region,
              city,
              COUNT(*) as event_count
            FROM event 
            WHERE website_id = '${website_id}'
              AND region = '${region}'
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id, region, city
            ORDER BY event_count DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const getUsersByTimezone = async (
  clickHouseClient,
  website_id,
  timezone,
  days = 30
) => {
  console.log(
    `Getting users in timezone: ${timezone} for website: ${website_id}`
  );
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              timezone,
              COUNT(*) as event_count,
              MIN(created_at) as first_seen
            FROM event 
            WHERE website_id = '${website_id}'
              AND timezone = '${timezone}'
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id, timezone
            ORDER BY event_count DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const getEnterpriseRegionUsers = async (
  clickHouseClient,
  website_id,
  enterpriseCities,
  days = 30
) => {
  const cityList = enterpriseCities.map((city) => `'${city}'`).join(",");
  console.log(
    `Getting enterprise users in cities: ${enterpriseCities} for website: ${website_id}`
  );
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              city,
              region,
              country,
              COUNT(DISTINCT content_id) as content_viewed
            FROM event 
            WHERE website_id = '${website_id}'
              AND city IN (${cityList})
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id, city, region, country
            ORDER BY content_viewed DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};
