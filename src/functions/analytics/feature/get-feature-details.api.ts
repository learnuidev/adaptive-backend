import middy from "@middy/core";
import cors from "@middy/http-cors";

import { getFeatureByIdApi } from "./get-feature-by-id.api.js";
import { listFeatureVersionsByFeatureIdApi } from "./list-feature-versions-by-feature-id.js";

export const getFeatureDetailsApi = async ({ id }: { id: string }) => {
  const feature = await getFeatureByIdApi({
    id,
  });

  if (!feature) {
    throw new Error("Feature not found");
  }

  const featureVersions = await listFeatureVersionsByFeatureIdApi({
    featureId: feature.id,
  });

  return {
    ...feature,
    versions: featureVersions,
  };
};

export const handler = middy(getFeatureDetailsApi).use(cors());
