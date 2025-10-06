# Analytics Data Model

This document describes the ClickHouse data model for storing and querying analytics events and user identities.

## Overview

The analytics system uses ClickHouse as the primary database for storing event data and user identities. The data is organized into two main tables:

1. **event** - Stores all user interaction events
2. **identity** - Stores user identity and device information

## Event Table Schema

### Table Definition

```sql
CREATE TABLE IF NOT EXISTS event (
  id String,
  visitor_id String,
  session_id String,
  identity_id String,
  website_id LowCardinality(String),
  type LowCardinality(String),
  event_name String,
  content_id String,
  href String,
  domain String,
  created_at DateTime64(3, 'UTC'),
  email String,
  ip_address IPv4,
  country LowCardinality(String),
  region LowCardinality(String),
  city String,
  latitude Float64,
  longitude Float64,
  timezone LowCardinality(String),
  os_name LowCardinality(String),
  os_version String,
  browser_name LowCardinality(String),
  browser_version String,
  device_vendor LowCardinality(String),
  device_model String,
  viewport_width UInt16,
  viewport_height UInt16,
  metadata Map(String, String)
)
ENGINE = MergeTree
ORDER BY (website_id, created_at);
```

### Field Descriptions

| Field             | Type                   | Description                          |
| ----------------- | ---------------------- | ------------------------------------ |
| `id`              | String                 | Unique event identifier (ULID)       |
| `visitor_id`      | String                 | Unique visitor identifier            |
| `session_id`      | String                 | Session identifier                   |
| `identity_id`     | String                 | User identity identifier             |
| `website_id`      | LowCardinality(String) | Website identifier                   |
| `type`            | LowCardinality(String) | Event type (pageview, custom, etc.)  |
| `event_name`      | String                 | Name of the custom event             |
| `content_id`      | String                 | Content identifier (if applicable)   |
| `href`            | String                 | Full URL of the page                 |
| `domain`          | String                 | Domain name                          |
| `created_at`      | DateTime64(3, 'UTC')   | Timestamp with millisecond precision |
| `email`           | String                 | User email (if available)            |
| `ip_address`      | IPv4                   | User's IP address                    |
| `country`         | LowCardinality(String) | Country code (ISO 3166-1)            |
| `region`          | LowCardinality(String) | Region/state code                    |
| `city`            | String                 | City name                            |
| `latitude`        | Float64                | Geographic latitude                  |
| `longitude`       | Float64                | Geographic longitude                 |
| `timezone`        | LowCardinality(String) | Timezone identifier                  |
| `os_name`         | LowCardinality(String) | Operating system name                |
| `os_version`      | String                 | Operating system version             |
| `browser_name`    | LowCardinality(String) | Browser name                         |
| `browser_version` | String                 | Browser version                      |
| `device_vendor`   | LowCardinality(String) | Device manufacturer                  |
| `device_model`    | String                 | Device model                         |
| `viewport_width`  | UInt16                 | Screen viewport width                |
| `viewport_height` | UInt16                 | Screen viewport height               |
| `metadata`        | Map(String, String)    | Additional event metadata            |

## Identity Table Schema

### Table Definition

```sql
CREATE TABLE IF NOT EXISTS identity (
  id String,
  email String,
  ip_address String,
  os_name String,
  os_version String,
  device_model String,
  device_vendor String,
  browser_name String,
  browser_version String,
  website_id String,
  email_and_device_type String,
  created_at DateTime,
  updated_at DateTime,
  country String,
  city String,
  region String,
  latitude Float64,
  longitude Float64,
  timezone String,
  metadata Map(String, String)
)
ENGINE = MergeTree
ORDER BY (website_id, created_at);
```

### Field Descriptions

| Field                   | Type                | Description                                     |
| ----------------------- | ------------------- | ----------------------------------------------- |
| `id`                    | String              | Unique identity identifier (ULID)               |
| `email`                 | String              | User email address                              |
| `email_and_device_type` | String              | Composite key for email + device fingerprinting |
| `website_id`            | String              | Website identifier                              |
| `created_at`            | DateTime            | Identity creation timestamp                     |
| `updated_at`            | DateTime            | Last update timestamp                           |
| `ip_address`            | String              | IP address                                      |
| `country`               | String              | Country code                                    |
| `region`                | String              | Region/state                                    |
| `city`                  | String              | City name                                       |
| `latitude`              | Float64             | Geographic latitude                             |
| `longitude`             | Float64             | Geographic longitude                            |
| `timezone`              | String              | Timezone identifier                             |
| `os_name`               | String              | Operating system name                           |
| `os_version`            | String              | Operating system version                        |
| `device_model`          | String              | Device model                                    |
| `device_vendor`         | String              | Device manufacturer                             |
| `browser_name`          | String              | Browser name                                    |
| `browser_version`       | String              | Browser version                                 |
| `metadata`              | Map(String, String) | Additional identity metadata                    |

## Data Flow

### 1. Event Ingestion

Events are first stored in DynamoDB (EventsTableV2) and then asynchronously ingested into ClickHouse:

```typescript
// DynamoDB event structure
const ddbEvent = {
  id: "01K646STTAYEA10JXAQX8FZB2K",
  visitorId: "aa0760f4-ff9f-47ea-a2cf-feb01b274f20",
  sessionId: "sd54b5ada-f54b-46ba-89c9-7e820820ae65",
  identityId: "01K646SNFB4JZSMBMR3QSJWVF6",
  websiteId: "mando-prod",
  type: "custom",
  extraData: {
    eventName: "content-viewed",
    contentid: "b3f8880b-def5-5ff7-97a0-cbab2b07b41d",
    email: "learnuidev@gmail.com",
  },
  href: "https://www.mandarino.io/convos",
  domain: "www.mandarino.io",
  createdAt: 1758930463562,
  // ... device and location info
};
```

### 2. Data Transformation

DynamoDB events are transformed to ClickHouse format using the `mapDDBEvent()` function:

```typescript
export function mapDDBEvent(event: any) {
  return {
    id: event.id,
    visitor_id: event.visitorId,
    session_id: event.sessionId,
    identity_id: event.identityId,
    website_id: event.websiteId,
    type: event.type,
    event_name: event.extraData?.eventName,
    content_id: event.extraData?.contentid,
    href: event.href,
    domain: event.domain,
    created_at: event.createdAt,
    email: event.email,
    ip_address: event.ipAddress,
    country: event.country,
    region: event.region,
    city: event.city,
    latitude: event.latitude,
    longitude: event.longitude,
    timezone: event.timezone,
    os_name: event.os_name,
    os_version: event.os_version,
    browser_name: event.browser_name,
    browser_version: event.browser_version,
    device_vendor: event.device_vendor,
    device_model: event.device_model,
    viewport_width: event.viewport?.width,
    viewport_height: event.viewport?.height,
    metadata: event.extraData,
  };
}
```

## Event Types

### Pageview Events

- `type: "pageview"`
- Contains page navigation information
- Automatically tracked for all page loads

### Custom Events

- `type: "custom"`
- Defined by user via tracking code
- `event_name` specifies the custom event type
- `metadata` contains event-specific data

## Common Query Patterns

### 1. Total Visitors by Geo Location

```sql
SELECT
  country,
  region,
  city,
  COUNT(DISTINCT visitor_id) as visitors
FROM event
WHERE website_id = 'website-id'
  AND created_at >= 'start-date'
GROUP BY country, region, city
ORDER BY visitors DESC
```

### 2. Funnel Analysis

```sql
SELECT
  visitor_id,
  session_id,
  metadata,
  min(created_at) as ts,
  count() as event_count
FROM event
WHERE website_id = 'website-id'
  AND event_name = 'goal-name'
  AND created_at >= 'start-date'
GROUP BY visitor_id, session_id, metadata
```

### 3. Time Series Analytics

```sql
-- By hour (last 24h)
SELECT toStartOfHour(created_at) as hour, COUNT(*) as total
FROM event
WHERE website_id = 'website-id'
  AND created_at >= 'start-date'
GROUP BY hour
ORDER BY hour ASC

-- By day (week/month)
SELECT toDate(created_at) as day, COUNT(*) as total
FROM event
WHERE website_id = 'website-id'
  AND created_at >= 'start-date'
GROUP BY day
ORDER BY day ASC
```

## Performance Considerations

1. **LowCardinality Data Types**: Used for fields with low cardinality (country, browser_name, etc.) to optimize storage and query performance
2. **MergeTree Engine**: Provides efficient time-series data storage and querying
3. **Primary Key**: Ordered by `(website_id, created_at)` for optimal time-based queries
4. **IPv4 Type**: Optimized storage for IP addresses
5. **DateTime64**: Millisecond precision for accurate event timing

## Data Retention

- Events are stored indefinitely in ClickHouse
- Consider implementing TTL policies based on business requirements
- DynamoDB events may have different retention policies

## Integration Points

- **DynamoDB**: Source of truth for event data
- **Lambda Functions**: Handle event ingestion and transformation
- **API Gateway**: Exposes analytics endpoints
- **Cognito**: User authentication for accessing analytics data
