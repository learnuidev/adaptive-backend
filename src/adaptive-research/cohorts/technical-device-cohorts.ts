export const getMobileUsers = async (
  clickHouseClient,
  website_id,
  days = 30,
  maxViewport = 768
) => {
  console.log(
    `Getting mobile users for website: ${website_id}, max viewport: ${maxViewport}`
  );
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              viewport_width,
              device_vendor,
              device_model,
              COUNT(*) as event_count
            FROM event 
            WHERE website_id = '${website_id}'
              AND viewport_width <= ${maxViewport}
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id, viewport_width, device_vendor, device_model
            ORDER BY event_count DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const getBrowserCohort = async (
  clickHouseClient,
  website_id,
  browserName,
  days = 30
) => {
  console.log(`Getting ${browserName} users for website: ${website_id}`);
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              browser_name,
              browser_version,
              COUNT(*) as event_count
            FROM event 
            WHERE website_id = '${website_id}'
              AND browser_name = '${browserName}'
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id, browser_name, browser_version
            ORDER BY event_count DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};
