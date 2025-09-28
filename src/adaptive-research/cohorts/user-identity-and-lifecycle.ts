export const getIdentifiedUsers = async (
  clickHouseClient,
  website_id,
  days = 30
) => {
  console.log(`Getting identified users for website: ${website_id}`);
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              email,
              COUNT(*) as event_count,
              COUNT(DISTINCT session_id) as session_count
            FROM event 
            WHERE website_id = '${website_id}'
              AND identity_id != ''
              AND created_at >= now() - INTERVAL ${days} DAY
            GROUP BY identity_id, email
            ORDER BY event_count DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

export const getNewUserCohort = async (
  clickHouseClient,
  website_id,
  startDate,
  endDate
) => {
  console.log(
    `Getting new user cohort for website: ${website_id} from ${startDate} to ${endDate}`
  );
  const resp = await clickHouseClient.query({
    query: `SELECT 
              identity_id,
              toStartOfWeek(MIN(created_at)) as cohort_week,
              COUNT(*) as total_events,
              COUNT(DISTINCT session_id) as total_sessions
            FROM event 
            WHERE website_id = '${website_id}'
              AND identity_id != ''
              AND created_at BETWEEN '${startDate}' AND '${endDate}'
            GROUP BY identity_id
            HAVING MIN(created_at) BETWEEN '${startDate}' AND '${endDate}'
            ORDER BY cohort_week DESC, total_events DESC`,
    format: "JSONEachRow",
  });
  return await resp.json();
};
