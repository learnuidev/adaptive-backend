export const getContentViewers = async (
  clickHouseClient,
  website_id,
  days = 30
) => {
  console.log(
    `Getting content viewers for website: ${website_id}, days: ${days}`
  );
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              COUNT(*) as view_count,
              MIN(created_at) as first_viewed
            FROM event 
            WHERE website_id = '${website_id}'
              AND event_name = 'content-viewed'
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id
            HAVING view_count > 0
            ORDER BY view_count DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const getPowerUsers = async (
  clickHouseClient,
  website_id,
  days = 7,
  minContentViews = 5
) => {
  console.log(
    `Getting power users for website: ${website_id}, min views: ${minContentViews}`
  );
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              COUNT(DISTINCT content_id) as unique_content_count,
              COUNT(*) as total_views
            FROM event 
            WHERE website_id = '${website_id}'
              AND event_name = 'content-viewed'
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id
            HAVING unique_content_count >= ${minContentViews}
            ORDER BY unique_content_count DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const getReturningUsers = async (
  clickHouseClient,
  website_id,
  days = 30,
  minSessions = 2
) => {
  console.log(
    `Getting returning users for website: ${website_id}, min sessions: ${minSessions}`
  );
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              COUNT(DISTINCT session_id) as session_count,
              MIN(created_at) as first_seen,
              MAX(created_at) as last_seen
            FROM event 
            WHERE website_id = '${website_id}'
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id
            HAVING session_count >= ${minSessions}
            ORDER BY session_count DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const getHighIntentUsers = async (
  clickHouseClient,
  website_id,
  contentIds,
  days = 30
) => {
  const contentIdList = contentIds.map((id) => `'${id}'`).join(",");
  console.log(
    `Getting high intent users for website: ${website_id}, content IDs: ${contentIds.length}`
  );
  const resp = await clickHouseClient.query({
    query: `SELECT DISTINCT
              identity_id,
              groupUniqArray(content_id) as viewed_content,
              MIN(created_at) as first_viewed
            FROM event 
            WHERE website_id = '${website_id}'
              AND event_name = 'content-viewed'
              AND content_id IN (${contentIdList})
              AND created_at >= now() - INTERVAL ${days} DAY
              AND identity_id != ''
            GROUP BY identity_id
            ORDER BY first_viewed DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};
