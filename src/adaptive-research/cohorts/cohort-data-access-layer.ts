// cohort-definitions.js
export const createCohortDefinition = async (clickHouseClient, cohortData) => {
  const { website_id, name, description, type, config, refresh_schedule } =
    cohortData;

  const resp = await clickHouseClient.query({
    query: `INSERT INTO cohort_definitions 
            (website_id, name, description, type, config, refresh_schedule) 
            VALUES (?, ?, ?, ?, ?, ?)`,
    format: "JSONEachRow",
    query_params: {
      website_id,
      name,
      description,
      type,
      config,
      refresh_schedule,
    },
  });
  return resp;
};

export const getCohortMembers = async (
  clickHouseClient,
  cohortId,
  websiteId,
  limit = 1000
) => {
  const resp = await clickHouseClient.query({
    query: `SELECT 
              cm.identity_id,
              up.email,
              cm.first_qualified_at,
              cm.last_qualified_at,
              cm.qualification_count,
              cm.metrics
            FROM cohort_members cm
            LEFT JOIN user_profiles up ON cm.identity_id = up.identity_id AND cm.website_id = up.website_id
            WHERE cm.cohort_id = '${cohortId}' 
              AND cm.website_id = '${websiteId}'
            ORDER BY cm.last_qualified_at DESC
            LIMIT ${limit}`,
    format: "JSONEachRow",
  });
  return await resp.json();
};

// cohort-refresh.js - Automated cohort population
export const refreshCohort = async (clickHouseClient, cohortId, websiteId) => {
  // Get cohort definition
  const cohortResp = await clickHouseClient.query({
    query: `SELECT * FROM cohort_definitions WHERE cohort_id = '${cohortId}' AND website_id = '${websiteId}'`,
    format: "JSONEachRow",
  });
  const cohort = await cohortResp.json();

  if (!cohort.length) throw new Error("Cohort not found");

  const config = JSON.parse(cohort[0].config);

  // Build dynamic query based on cohort type and config
  const query = buildCohortQuery(cohort[0].type, config, websiteId);

  // Execute and insert new members
  const membersResp = await clickHouseClient.query({
    query: `INSERT INTO cohort_members 
            (cohort_id, website_id, identity_id, first_qualified_at, last_qualified_at, metrics)
            ${query}`,
    format: "JSONEachRow",
  });

  return membersResp;
};

// Helper function to build cohort queries
const buildCohortQuery = (type, config, websiteId) => {
  switch (type) {
    case "behavioral":
      return `
        SELECT 
          '${config.cohortId}' as cohort_id,
          '${websiteId}' as website_id,
          identity_id,
          now() as first_qualified_at,
          now() as last_qualified_at,
          jsonSerialize(map('content_views', content_views)) as metrics
        FROM user_profiles
        WHERE website_id = '${websiteId}'
          AND total_content_views >= ${config.minViews}
      `;
    case "geographic":
      return `
        SELECT 
          '${config.cohortId}' as cohort_id,
          '${websiteId}' as website_id,
          identity_id,
          now() as first_qualified_at,
          now() as last_qualified_at,
          jsonSerialize(map('region', primary_region)) as metrics
        FROM user_geography
        WHERE website_id = '${websiteId}'
          AND primary_region IN (${config.regions.map((r) => `'${r}'`).join(",")})
      `;
    // ... other cohort types
  }
};
