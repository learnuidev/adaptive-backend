// import { clientTest } from './test-client.mjs'

// import { processRolloutRules } from "adaptive.fyi";
import { cohortQuery, processRolloutRules } from "adaptive.fyi";
import { testClient } from "./test-client.mjs";

const websiteId = "01K66XSK34CXMV0TT8ATS953W0";

const sampleRollOutRules = [
  {
    type: "and",
    fields: [
      {
        field: "email",
        op: "=",
        value: "learnuidev@gmail.com",
      },
    ],
  },
];

async function evaluateRolloutRules(website, rolloutRules) {
  const query = processRolloutRules(website, rolloutRules);
  console.log("query", query);

  const result = await testClient.query({
    query: `${query}`,
    format: "JSONEachRow",
  });

  const rows = await result.json();
  return rows;
}

evaluateRolloutRules(websiteId, sampleRollOutRules).then((rows) => {
  console.log("rows", rows);
});
