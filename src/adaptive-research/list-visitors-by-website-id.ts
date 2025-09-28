export const listVisitorsByWebsiteId = async (clickHouseClient, websiteId) => {
  console.log(`Listing visitors for websiteId: ${websiteId}`);
  const resp = await clickHouseClient.query({
    query: `
      SELECT 
        DISTINCT visitor_id, 
        max(created_at) as last_seen,
        anyLast(email) as email,
        anyLast(country) as country,
        anyLast(region) as region,
        anyLast(city) as city
      FROM event
      WHERE website_id = '${websiteId}'
      GROUP BY visitor_id
      ORDER BY last_seen DESC
    `,
    format: "JSONEachRow",
  });
  return await resp.json();
};
