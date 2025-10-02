import middy from "@middy/core";
import cors from "@middy/http-cors";

import { validateWebSiteId } from "../../auth/validate-website-id.js";
import { getFeatureByFeatureKeyAndWebsiteIdApi } from "./get-feature-by-feature-key-and-website-id.api.js";
import { listFeatureVersionsByFeatureIdApi } from "./list-feature-versions-by-feature-id.js";

// todo: implement this
// To determine if a feature is enabled, you’ll typically:
// 1. Extract the featureKey from event.body
// 2. Get feature by feature key and website id
// 3. Get feature versions
// 4. See which version this user is in the rollout for against the user's rollout rules

export const handler = middy(async (event) => {
  try {
    await validateWebSiteId(event);

    const { email, featureKey, websiteId } = JSON.parse(event.body);

    const feature = await getFeatureByFeatureKeyAndWebsiteIdApi({
      featureKey: featureKey,
      websiteId: websiteId,
    });

    if (!feature) {
      throw new Error("Feature not found");
    }

    const featureVersions = await listFeatureVersionsByFeatureIdApi({
      featureId: feature.featureId,
    });

    if (!featureVersions || featureVersions?.length === 0) {
      const response = {
        statusCode: 200,

        body: JSON.stringify({ enabled: true }),
      };

      return response;
    }

    // todo: implement this
    // 5. See which version this user is in the rollout for against the user's rollout rules

    const response = {
      statusCode: 200,

      body: JSON.stringify({ enabled: true }),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        enabled: true,
      }),
    };
    return response;
  }
}).use(cors());
