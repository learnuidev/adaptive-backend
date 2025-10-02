import middy from "@middy/core";
import cors from "@middy/http-cors";
import { addFeatureApi } from "./add-feature.api.js";
import { z } from "zod";

const addFeatureSchema = z.object({
  name: z.string().min(1),
  featureKey: z.string().min(1),
  description: z.string().optional(),
  userId: z.string().email(),
  tags: z.array(z.string()).optional(),
  websiteId: z.ulid(),
  featureKeyAndWebsiteId: z.string().min(1),
});

export const handler = middy(async (event) => {
  const userId = event.requestContext.authorizer?.claims?.email;

  try {
    const rawParams = JSON.parse(event.body);

    const rawInputParams = {
      name: rawParams.name,
      featureKey: rawParams.featureKey,
      description: rawParams.description,
      userId,
      tags: rawParams.tags,
      websiteId: rawParams.websiteId,
      featureKeyAndWebsiteId: `${rawParams.key}-${rawParams.websiteId}`,
    };

    const validated = addFeatureSchema.parse(rawInputParams);

    const newFeature = await addFeatureApi(validated);

    const response = {
      statusCode: 200,
      body: JSON.stringify(newFeature),
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
}).use(cors());
