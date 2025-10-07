import { z } from "zod";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";

// Filter schema for event attributes
const EventAttributeFilter = z.object({
  key: z.string().min(1, "Filter key is required"),
  operator: z.enum([
    "eq",
    "ne",
    "contains",
    "startsWith",
    "endsWith",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "nin",
  ]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
  ]),
});

// Input validation schema
const GetLiveUsersInput = z.object({
  websiteId: z.string().min(1, "Website ID is required"),
  timeWindowMinutes: z.number().int().min(1).max(1440).optional().default(30), // Max 24 hours
  includeSummary: z.boolean().optional().default(true),
  includeGeography: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(1000).optional().default(100),
  filters: z.array(EventAttributeFilter).optional().default([]),
});

export const getLiveUsersApi = async (input: any) => {
  // Validate input
  const validatedInput = GetLiveUsersInput.parse(input);

  const {
    websiteId,
    timeWindowMinutes,
    includeSummary,
    includeGeography,
    limit,
    filters,
  } = validatedInput;

  try {
    // Get live users with filters
    const liveUsers = await clickhouseClient.getLiveUsersByWebsiteId(
      clickhouseClient.client,
      websiteId,
      timeWindowMinutes,
      filters
    );

    // Apply limit
    const limitedUsers = liveUsers.slice(0, limit);

    // Prepare response
    const response: any = {
      liveUsers: limitedUsers,
      metadata: {
        websiteId,
        timeWindowMinutes,
        totalLiveUsers: liveUsers.length,
        returnedUsers: limitedUsers.length,
        lastUpdated: new Date().toISOString(),
        timezone: "UTC",
      },
    };

    // Include summary if requested
    if (includeSummary) {
      const summary = await clickhouseClient.getLiveUserSummaryByWebsiteId(
        clickhouseClient.client,
        websiteId,
        timeWindowMinutes,
        filters
      );
      response.summary = summary;
    }

    // Include geographic breakdown if requested
    if (includeGeography) {
      const geography = await clickhouseClient.getLiveUsersByGeography(
        clickhouseClient.client,
        websiteId,
        timeWindowMinutes,
        filters
      );
      response.geography = geography;
    }

    return response;
  } catch (error) {
    console.error("Error in getLiveUsersApi:", error);
    throw new Error(`Failed to fetch live users: ${error.message}`);
  }
};
