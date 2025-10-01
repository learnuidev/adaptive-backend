import middy from "@middy/core";
import cors from "@middy/http-cors";
import { addFeatureApi } from "./add-feature.api.js";
import { z } from "zod";

const addFeatureSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  websiteId: z.ulid(),
});

export const handler = middy(async (event) => {
  try {
    const rawParams = JSON.parse(event.body);

    const validated = addFeatureSchema.parse(rawParams);

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
