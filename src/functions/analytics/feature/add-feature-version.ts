import middy from "@middy/core";
import cors from "@middy/http-cors";
import {
  addFeatureVersionApi,
  addFeatureVersionSchema,
} from "./add-feature-version.api.js";

const addNewFeatureVersionHandler = async (event) => {
  try {
    const rawParams = JSON.parse(event.body);

    const newFeatureVersionInput = {
      featureId: rawParams.featureId,
      description: rawParams.description,
      version: rawParams.version,
      config: rawParams.config,
      isActive: rawParams.isActive,
      rolloutPercentage: rawParams.rolloutPercentage,
      rolloutRules: rawParams.rolloutRules,
    };

    const validated = addFeatureVersionSchema.parse(newFeatureVersionInput);

    const newFeatureVersion = await addFeatureVersionApi(validated);

    const response = {
      statusCode: 200,
      body: JSON.stringify(newFeatureVersion),
    };
    return response;
  } catch (err) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        message: err.message,
      }),
    };
    return response;
  }
};

export const handler = middy(addNewFeatureVersionHandler).use(cors());
