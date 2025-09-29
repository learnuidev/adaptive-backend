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

class ClickHouseTrendGenerator {
  private client: ClickHouseClient;

  constructor(clickhouseClient: ClickHouseClient) {
    this.client = clickhouseClient;
  }

  /**
   * Generate custom trend based on any metadata field
   * @param {CustomTrendOptions} options
   * @returns {Promise<TrendData[]>} Trend data
   */
  async generateCustomTrend(options: CustomTrendOptions): Promise<TrendData[]> {
    const {
      metadataField,
      trendType = "count",
      timeRange = "7d",
      eventType = null,
      groupByTime = "day",
      limit = 50,
    } = options;

    // Build the query based on parameters
    const query = this.buildCustomTrendQuery({
      metadataField,
      trendType,
      timeRange,
      eventType,
      groupByTime,
      limit,
    });

    return await this.executeQuery(query);
  }

  buildCustomTrendQuery(params: CustomTrendQueryParams): string {
    const {
      metadataField,
      trendType,
      timeRange,
      eventType,
      groupByTime,
      limit,
    } = params;

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
  }

  /**
   * Generate top N trends for a metadata field
   */
  async getTopMetadataTrends(
    metadataField: string,
    topN: number = 10,
    timeRange: TimeRange = "7d"
  ): Promise<TopMetadataTrendData[]> {
    const query = `
            SELECT 
                JSONExtractString(metadata, '${metadataField}') as metadata_value,
                COUNT(*) as event_count,
                COUNT(DISTINCT visitor_id) as unique_users
            FROM events 
            WHERE created_at >= now() - INTERVAL ${this.getTimeInterval(timeRange)}
                AND metadata_value != ''
            GROUP BY metadata_value
            ORDER BY event_count DESC
            LIMIT ${topN}
        `;

    return await this.executeQuery(query);
  }

  /**
   * Generate trend over time for specific metadata value
   */
  async getMetadataValueTrend(
    metadataField: string,
    metadataValue: string,
    timeRange: TimeRange = "30d",
    groupByTime: GroupByTime = "day"
  ): Promise<MetadataValueTrendData[]> {
    const timeFunction = this.getTimeFunction(groupByTime);
    const interval = this.getTimeInterval(timeRange);

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

    return await this.executeQuery(query);
  }

  getTimeInterval(timeRange: TimeRange): string {
    const intervals: Record<TimeRange, string> = {
      "1d": "1 DAY",
      "7d": "7 DAY",
      "30d": "30 DAY",
      "90d": "90 DAY",
    };
    return intervals[timeRange] || "7 DAY";
  }

  getTimeFunction(groupByTime: GroupByTime): string {
    const functions: Record<GroupByTime, string> = {
      hour: "toHour",
      day: "toDate",
      week: "toMonday",
      month: "toStartOfMonth",
    };
    return functions[groupByTime] || "toDate";
  }

  async executeQuery<T = any>(query: string): Promise<T[]> {
    try {
      // This would use your ClickHouse client implementation
      // Example with clickhouse-js:
      const result = await this.client.query({
        query: query,
        format: "JSONEachRow",
      });

      return await result.json();
    } catch (error) {
      console.error("ClickHouse query error:", error);
      throw error;
    }
  }
}

// Usage Examples
const trendGenerator = new ClickHouseTrendGenerator(clickhouseClient);

// Example 1: Trend of content views by content ID
const contentTrends = await trendGenerator.generateCustomTrend({
  metadataField: "contentid",
  trendType: "unique_users",
  timeRange: "30d",
  eventType: "content-viewed",
  groupByTime: "day",
});

// Example 2: Top 10 most common metadata values
const topContent = await trendGenerator.getTopMetadataTrends(
  "contentid",
  10,
  "7d"
);

// Example 3: Specific content trend over time
const specificContentTrend = await trendGenerator.getMetadataValueTrend(
  "contentid",
  "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
  "30d",
  "day"
);

// Example 4: Custom event trends
const customEventTrends = await trendGenerator.generateCustomTrend({
  metadataField: "eventName",
  trendType: "count",
  timeRange: "7d",
  groupByTime: "hour",
});

console.log("Content Trends:", contentTrends);
console.log("Top Content:", topContent);
