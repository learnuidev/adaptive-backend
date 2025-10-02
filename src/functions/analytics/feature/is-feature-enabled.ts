import middy from "@middy/core";
import cors from "@middy/http-cors";

import { validateWebSiteId } from "../../auth/validate-website-id.js";
import { getFeatureByFeatureKeyAndWebsiteIdApi } from "./get-feature-by-feature-key-and-website-id.api.js";
import { listFeatureVersionsByFeatureIdApi } from "./list-feature-versions-by-feature-id.js";
import { CohortRule, processRolloutRules } from "adaptive.fyi";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getFeatureVersionApi } from "./get-feature-version.api.js";

// todo: implement this
// To determine if a feature is enabled, you’ll typically:
// 1. Extract the featureKey from event.body
// 2. Get feature by feature key and website id
// 3. Get feature versions
// 4. See which version this user is in the rollout for against the user's rollout rules

type RolloutRule = {
  type: "and" | "or";
  fields: CohortRule[];
};

async function evaluateRolloutRules({
  websiteId,
  rolloutRules,
}: {
  websiteId: string;
  rolloutRules: RolloutRule[];
}) {
  const query = processRolloutRules(websiteId, rolloutRules);
  console.log("query", query);

  const result = await clickhouseClient.client.query({
    query: `${query}`,
    format: "JSONEachRow",
  });

  const rows = await result.json();
  return rows;
}

export const handler = middy(async (event) => {
  try {
    await validateWebSiteId(event);

    const { email, featureKey, websiteId, featureVersionId } = JSON.parse(
      event.body
    );

    const feature = await getFeatureByFeatureKeyAndWebsiteIdApi({
      featureKey: featureKey,
      websiteId: websiteId,
    });

    if (!feature) {
      throw new Error("Feature not found");
    }

    if (featureVersionId) {
      const featureVersion = await getFeatureVersionApi({
        id: featureVersionId,
      });

      if (!featureVersion) {
        const response = {
          statusCode: 200,

          body: JSON.stringify({ enabled: false }),
        };
        return response;
      }

      const evaluated = await processRolloutRules(
        websiteId,
        featureVersion?.rolloutRules
      );

      if (evaluated?.length === 0) {
        const response = {
          statusCode: 200,

          body: JSON.stringify({ enabled: false }),
        };
        return response;
      }

      // todo: implement this
      // 5. See which version this user is in the rollout for against the user's rollout rules

      const response = {
        statusCode: 200,

        body: JSON.stringify({ enabled: true, featureVersion }),
      };
      return response;
    }

    const featureVersions = await listFeatureVersionsByFeatureIdApi({
      featureId: feature.id,
    });

    if (!featureVersions || featureVersions?.length === 0) {
      const response = {
        statusCode: 200,

        body: JSON.stringify({ enabled: true }),
      };

      return response;
    }

    const evaluated = (
      await Promise.all(
        featureVersions?.map(async (version: any) => {
          const evaluated = await evaluateRolloutRules(
            websiteId,
            // @ts-ignore
            version?.rolloutRules
          );

          if (evaluated?.length === 0) {
            return false;
            // return {
            //   id: version.id,
            //   version: version?.version,
            //   description: version?.description,
            // };
          } else {
            return {
              id: version.id,
              version: version?.version,
              description: version?.description,
            };
          }
        })
      )
    )?.filter(Boolean);

    if (evaluated?.length === 0) {
      const response = {
        statusCode: 200,

        body: JSON.stringify({ enabled: false }),
      };
      return response;
    }

    // todo: implement this
    // 5. See which version this user is in the rollout for against the user's rollout rules

    const response = {
      statusCode: 200,

      body: JSON.stringify({ enabled: true, versions: featureVersions }),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        message: err?.message,
      }),
    };
    return response;
  }
}).use(cors());
