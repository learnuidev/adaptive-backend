# Building an Analytics Service

This guide provides a step-by-step process for adding new analytics functions to the adaptive backend service.

## Overview

When adding a new analytics feature, you need to implement the ClickHouse query logic, expose it through API Gateway, and create corresponding Lambda handlers. This follows a consistent pattern across all analytics services.

## Step 1: Create ClickHouse Function

Create the core analytics logic in `src/adaptive-research/<function-name>.ts`.

### Function Structure

```typescript
import { buildDateRange } from "./utils.js";

/**
 * Analytics function description
 * @param clickHouseClient - ClickHouse client instance
 * @param websiteId - Website identifier
 * @param period - Time period (week, month, year, ytd, last24h, custom)
 * @param from - Start date for custom period
 * @param to - End date for custom period
 * @returns Promise<AnalyticsResult> - Query results
 */
export const getAnalyticsData = async (
  clickHouseClient: any,
  websiteId: string,
  period: string,
  from?: Date,
  to?: Date
) => {
  const { start, end } = buildDateRange({ period, from, to });

  const query = `
    SELECT
      -- Your SELECT columns here
      COUNT(*) as total
    FROM event
    WHERE website_id = '${websiteId}'
      AND created_at >= '${start}'
      ${period === "custom" ? `AND created_at <= '${end.toISOString()}'` : ""}
    GROUP BY -- Your grouping columns
    ORDER BY -- Your ordering
  `;

  const resp = await clickHouseClient.query({
    query,
    format: "JSONEachRow",
  });

  return await resp.json();
};
```

### Export to ClickHouse Client

Update `src/adaptive-research/clickhouse.ts` to export your new function:

```typescript
// Import your function
import { getAnalyticsData } from "./your-function-name.js";

export const clickhouse = (params: any) => {
  const client = createClient(params);

  return {
    // ... existing exports
    // Add your function
    getAnalyticsData,
  };
};
```

## Step 2: Update Serverless Configuration

Add the new API route to `serverless.yml`.

### API Gateway Configuration

```yaml
functions:
  # ... existing functions
  
  getYourAnalytics:
    handler: src/functions/analytics/your-function/handler.handler
    events:
      - http:
          path: analytics/your-endpoint
          method: post
          cors: true
          authorizer:
            name: ApiAuthorizer
            type: request
    environment:
      TABLE_NAME: ${self:custom.tableName}
      REGION: ${self:custom.region}
      CLICKHOUSE_URL: ${ssm:/clickhouse-url}
      CLICKHOUSE_USERNAME: ${ssm:/clickhouse-username}
      CLICKHOUSE_PASSWORD: ${ssm:/clickhouse-password}
```

### Key Points

- Use `post` method for complex queries with parameters
- Path should follow pattern: `analytics/your-endpoint`
- Enable CORS for all endpoints
- Include ClickHouse environment variables
- Use the same authorizer as other analytics endpoints

## Step 3: Create API Handler

Create the API layer in `src/functions/analytics/your-function/` directory.

### API Logic (`your-function.api.ts`)

```typescript
import { z } from "zod";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";

// Input validation schema
const GetYourAnalyticsInput = z.object({
  websiteId: z.string(),
  period: z.enum(["last24h", "week", "month", "year", "ytd", "custom"]),
  from: z.string().optional(),
  to: z.string().optional(),
  // Add other input parameters
});

export const getYourAnalyticsApi = async (input: any) => {
  // Validate input
  const validatedInput = GetYourAnalyticsInput.parse(input);

  const { websiteId, period, from, to } = validatedInput;

  // Convert date strings if provided
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  // Execute ClickHouse query
  const result = await clickhouseClient.getAnalyticsData(
    clickhouseClient.client,
    websiteId,
    period,
    fromDate,
    toDate
  );

  return {
    data: result,
    period,
    websiteId,
    // Add other metadata
  };
};
```

### Lambda Handler (`handler.ts`)

```typescript
import middy from "@middy/core";
import cors from "@middy/http-cors";
import { getYourAnalyticsApi } from "./your-function.api.js";

export const handler = middy(async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const result = await getYourAnalyticsApi(body);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error in getYourAnalytics:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
}).use(cors());
```

## Step 4: Create Test File

Create a test file in `__tests/<function-name>.mjs` to test against mock data.

### Test Structure

```javascript
import { clickhouse } from "../src/adaptive-research/clickhouse.js";
import { buildDateRange } from "../src/adaptive-research/utils.js";

// Mock ClickHouse client for testing
const mockClickHouseClient = {
  query: async ({ query, format }) => {
    console.log("Mock Query:", query);
    
    // Return mock data based on the query
    if (query.includes("your specific query pattern")) {
      return {
        json: async () => [
          {
            // Mock data structure matching your query result
            total: 100,
            date: "2025-01-01",
            // other fields
          }
        ]
      };
    }
    
    // Default mock response
    return {
      json: async () => []
    };
  }
};

// Test function
async function testYourAnalyticsFunction() {
  console.log("Testing analytics function...");
  
  const client = clickhouse({
    url: "mock-url",
    username: "mock-user", 
    password: "mock-pass"
  });
  
  // Override client with mock
  client.client = mockClickHouseClient;
  
  try {
    const result = await client.getAnalyticsData(
      mockClickHouseClient,
      "test-website-id",
      "week"
    );
    
    console.log("Test Result:", JSON.stringify(result, null, 2));
    
    // Add assertions
    if (Array.isArray(result) && result.length > 0) {
      console.log("✅ Test passed - data returned");
    } else {
      console.log("❌ Test failed - no data returned");
    }
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testYourAnalyticsFunction();
```

### Running Tests

```bash
# Run your specific test
node __tests/your-function-name.mjs

# Run all tests
npm run test
```

## Best Practices

### 1. Input Validation
- Always use Zod schemas for input validation
- Validate all parameters before processing
- Handle optional parameters gracefully

### 2. Error Handling
- Implement proper error handling in API layer
- Return meaningful error messages
- Log errors for debugging

### 3. Performance
- Use appropriate ClickHouse data types (LowCardinality, etc.)
- Optimize queries with proper indexes
- Consider data volume when writing queries

### 4. Testing
- Test with realistic mock data
- Cover edge cases and error scenarios
- Validate query structure and results

### 5. Documentation
- Document function parameters and return types
- Include examples in function comments
- Update relevant documentation files

## Common Patterns

### Date Range Handling

```typescript
import { buildDateRange } from "./utils.js";

const { start, end } = buildDateRange({ period, from, to });

// Always include date filtering in queries
WHERE created_at >= '${start}'
  ${period === "custom" ? `AND created_at <= '${end.toISOString()}'` : ""}
```

### Website Filtering

```typescript
// Always filter by website_id for multi-tenant security
WHERE website_id = '${websiteId}'
```

### JSON Response Format

```typescript
return {
  data: result,
  metadata: {
    period,
    websiteId,
    lastUpdated: new Date().toISOString(),
    timezone: "UTC"
  }
};
```

## Example: Complete Function

For a complete example, see existing functions like:
- `src/adaptive-research/get-total-unique-users.ts`
- `src/adaptive-research/get-total-page-visits-by-website-id.ts`
- `src/adaptive-research/list-attribute-values.ts`

Each follows the same pattern described in this guide.
