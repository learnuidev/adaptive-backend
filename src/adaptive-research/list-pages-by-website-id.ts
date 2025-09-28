import { addParamToRoutes } from "./utils.js";

export const listPagesByWebsiteId = async (
  clickHouseClient: any,
  websiteId: string
) => {
  console.log(`Listing pages for websiteId: ${websiteId}`);
  const resp = await clickHouseClient.query({
    query: `
      SELECT DISTINCT href
      FROM event
      WHERE website_id = '${websiteId}'
        AND type = 'pageview'
      ORDER BY href ASC
    `,
    format: "JSONEachRow",
  });
  const routes = await resp.json();

  return addParamToRoutes(routes);
};
