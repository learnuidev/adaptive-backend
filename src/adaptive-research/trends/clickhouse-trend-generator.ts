import { ClickHouseClient } from "@clickhouse/client";

// Types
type TrendType = "count" | "unique_users" | "avg_per_user";
type TimeRange = "1d" | "7d" | "30d" | "90d";
type GroupByTime = "hour" | "day" | "week" | "month";

interface CustomTrendOptions {
  metadataField: string;
  trendType?: TrendType;
  timeRange?: TimeRange;
  eventType?: string | null;
  groupByTime?: GroupByTime;
  limit?: number;
}

interface CustomTrendQueryParams extends CustomTrendOptions {
  metadataField: string;
}

interface TrendData {
  time_period: string;
  metadata_value: string;
  trend_value: number;
}

interface TopMetadataTrendData {
  metadata_value: string;
  event_count: number;
  unique_users: number;
}

interface MetadataValueTrendData {
  time_period: string;
  event_count: number;
  daily_users: number;
}

// Pure functions for building queries
const buildCustomTrendQuery = (params: CustomTrendQueryParams): string => {
  const { metadataField, trendType, timeRange, eventType, groupByTime, limit } =
    params;

  // Map time range to ClickHouse interval
  const timeIntervals: Record<TimeRange, string> = {
    "1d": "1 DAY",
    "7d": "7 DAY",
    "30d": "30 DAY",
    "90d": "90 DAY",
  };

  // Map group by to ClickHouse functions
  const timeFunctions: Record<GroupByTime, string> = {
    hour: "toHour",
    day: "toDate",
    week: "toMonday",
    month: "toStartOfMonth",
  };

  const timeFunction = timeFunctions[groupByTime] || "toDate";
  const interval = timeIntervals[timeRange] || "7 DAY";

  // Build trend metric
  let metric: string;
  switch (trendType) {
    case "unique_users":
      metric = "COUNT(DISTINCT visitor_id)";
      break;
    case "avg_per_user":
      metric = "COUNT(*) / COUNT(DISTINCT visitor_id)";
      break;
    case "count":
    default:
      metric = "COUNT(*)";
  }

  // Build event filter
  const eventFilter = eventType ? `AND event_name = '${eventType}'` : "";

  return `
            SELECT 
                ${timeFunction}(created_at) as time_period,
                JSONExtractString(metadata, '${metadataField}') as metadata_value,
                ${metric} as trend_value
            FROM events 
            WHERE created_at >= now() - INTERVAL ${interval}
                ${eventFilter}
                AND metadata_value != ''
            GROUP BY time_period, metadata_value
            ORDER BY time_period DESC, trend_value DESC
            LIMIT ${limit}
        `;
};

const getTimeInterval = (timeRange: TimeRange): string => {
  const intervals: Record<TimeRange, string> = {
    "1d": "1 DAY",
    "7d": "7 DAY",
    "30d": "30 DAY",
    "90d": "90 DAY",
  };
  return intervals[timeRange] || "7 DAY";
};

const getTimeFunction = (groupByTime: GroupByTime): string => {
  const functions: Record<GroupByTime, string> = {
    hour: "toHour",
    day: "toDate",
    week: "toMonday",
    month: "toStartOfMonth",
  };
  return functions[groupByTime] || "toDate";
};

// Pure function to execute query
const executeQuery = async <T = any>(
  client: ClickHouseClient,
  query: string
): Promise<T[]> => {
  try {
    const result = await client.query({
      query: query,
      format: "JSONEachRow",
    });

    return await result.json();
  } catch (error) {
    console.error("ClickHouse query error:", error);
    throw error;
  }
};

// Module functions
// 1 Custom Trend
export const generateCustomTrend = async (
  client: ClickHouseClient,
  options: CustomTrendOptions
): Promise<TrendData[]> => {
  const {
    metadataField,
    trendType = "count",
    timeRange = "7d",
    eventType = null,
    groupByTime = "day",
    limit = 50,
  } = options;

  const query = buildCustomTrendQuery({
    metadataField,
    trendType,
    timeRange,
    eventType,
    groupByTime,
    limit,
  });

  return await executeQuery(client, query);
};

interface GetMetadataTrendsInput {
  client: ClickHouseClient;
  metadataField: string;
  topN?: number;
  timeRange?: TimeRange;
}
export const getTopMetadataTrends = async ({
  client,
  metadataField,
  topN = 10,
  timeRange = "7d",
}: GetMetadataTrendsInput): Promise<TopMetadataTrendData[]> => {
  const query = `
            SELECT 
                JSONExtractString(metadata, '${metadataField}') as metadata_value,
                COUNT(*) as event_count,
                COUNT(DISTINCT visitor_id) as unique_users
            FROM events 
            WHERE created_at >= now() - INTERVAL ${getTimeInterval(timeRange)}
                AND metadata_value != ''
            GROUP BY metadata_value
            ORDER BY event_count DESC
            LIMIT ${topN}
        `;

  return await executeQuery(client, query);
};

// 3. Get top metadata trends
export const getMetadataValueTrend = async (
  client: ClickHouseClient,
  metadataField: string,
  metadataValue: string,
  timeRange: TimeRange = "30d",
  groupByTime: GroupByTime = "day"
): Promise<MetadataValueTrendData[]> => {
  const timeFunction = getTimeFunction(groupByTime);
  const interval = getTimeInterval(timeRange);

  const query = `
            SELECT 
                ${timeFunction}(created_at) as time_period,
                COUNT(*) as event_count,
                COUNT(DISTINCT visitor_id) as daily_users
            FROM events 
            WHERE created_at >= now() - INTERVAL ${interval}
                AND JSONExtractString(metadata, '${metadataField}') = '${metadataValue}'
            GROUP BY time_period
            ORDER BY time_period
        `;

  return await executeQuery(client, query);
};

// Usage Examples (wrapped in async function)
const exampleUsage = async (client: ClickHouseClient) => {
  // Example 1: Trend of content views by content ID
  const contentTrends = await generateCustomTrend(client, {
    metadataField: "contentid",
    trendType: "unique_users",
    timeRange: "30d",
    eventType: "content-viewed",
    groupByTime: "day",
  });

  // Example 2: Top 10 most common metadata values
  const topContent = await getTopMetadataTrends({
    client,
    metadataField: "contentid",
    topN: 10,
    timeRange: "7d",
  });

  // Example 3: Specific content trend over time
  const specificContentTrend = await getMetadataValueTrend(
    client,
    "contentid",
    "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
    "30d",
    "day"
  );

  // Example 4: Custom event trends
  const customEventTrends = await generateCustomTrend(client, {
    metadataField: "eventName",
    trendType: "count",
    timeRange: "7d",
    groupByTime: "hour",
  });

  console.log("Content Trends:", contentTrends);
  console.log("Top Content:", topContent);
  console.log("Specific Content Trend:", specificContentTrend);
  console.log("Custom Event Trends:", customEventTrends);
};
