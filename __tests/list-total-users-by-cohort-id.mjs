import dotenv from "dotenv";
import { createClient } from "@clickhouse/client";
import { processRolloutRules } from "adaptive.fyi";
import { testClient } from "./test-client.mjs";

dotenv.config();

const cohort = {
  updatedAt: 1759436044686,
  websiteId: "01K66Y71NVHBWVFX8T9HB76WXH",
  createdAt: 1759436044686,
  cohortRules: [
    {
      type: "and",
      fields: [
        {
          field: "email",
          op: "LIKE",
          value: "gmail.com",
        },
      ],
    },
  ],
  id: "01K6K8YYCD7N1QNEKWPYBD6XK2",
  name: "Gmail users",
};

const sample_clickhouse_event = {
  id: "01K646STTAYEA10JXAQX8FZB2K",
  visitor_id: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
  session_id: "sd54b5ada-f54b-46ba-89c9-7e820820ae65",
  identity_id: "01K646SNFB4JZSMBMR3QSJWVF6",
  website_id: "mando-prod",
  type: "custom",
  event_name: "content-viewed",
  content_id: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
  href: "https://www.mandarino.io/convos",
  domain: "www.mandarino.io",
  created_at: "2025-09-28 05:59:48.290",
  email: "learnuidev@gmail.com",
  ip_address: "45.144.115.137",
  country: "US",
  region: "VA",
  city: "Ashburn",
  latitude: 39.018,
  longitude: -77.539,
  timezone: "America/New_York",
  os_name: "macOS",
  os_version: "10.15.7",
  browser_name: "Chrome",
  browser_version: "140.0.0.0",
  device_vendor: "Apple",
  device_model: "Macintosh",
  viewport_width: 342,
  viewport_height: 859,
  metadata: {
    contentid: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
    eventName: "content-viewed",
    email: "learnuidev@gmail.com",
  },
};

/**
 * listTotalUsersByCohortId
 * Counts unique users (identity_id) matching a cohort's rules within a given period.
 * @param {Object} clickHouseClient - ClickHouse client instance
 * @param {Object} cohort - Cohort object with cohortRules array
 * @param {string} period - One of: today, yesterday, day, week, month, year, last24h, last7d, last30d, last12m, wtd, mtd, ytd, all, custom
 * @param {Date} [from] - Required when period is 'custom'
 * @param {Date} [to] - Required when period is 'custom'
 * @param {string} [timezoneName="America/New_York"] - Timezone name
 * @returns {Promise<{current: number, previous: number}>} - User counts for current and previous periods
 */
async function listTotalUsersByCohortId(clickHouseClient, cohort) {
  const query = processRolloutRules(cohort.websiteId, cohort.cohortRules, {
    buildAll: true,
    selectors: ["email"],
  });

  console.log("query", query);

  const currentResp = await clickHouseClient.query({
    query: query[0],

    format: "JSONEachRow",
  });

  const current = await currentResp.json();

  return current;
}

const websiteId = "01K66Y71NVHBWVFX8T9HB76WXH";
// Example usage:
listTotalUsersByCohortId(testClient, cohort).then((resp) => {
  console.log("Total users by cohort:", resp);
});
