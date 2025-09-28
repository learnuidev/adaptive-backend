const createCohortTables = async (clickHouseClient) => {
  const resp = await clickHouseClient.query({
    query: `-- Cohort definitions table
CREATE TABLE IF NOT EXISTS cohort_definitions (
    cohort_id UUID DEFAULT generateUUIDv4(),
    website_id String,
    name String,
    description String,
    type Enum8(
        'behavioral' = 1,
        'geographic' = 2, 
        'demographic' = 3,
        'technical' = 4,
        'temporal' = 5
    ),
    -- JSON configuration for the cohort query parameters
    config String,
    -- Cron expression for automatic refresh
    refresh_schedule String,
    is_active Bool DEFAULT true,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (website_id, cohort_id);

-- Cohort members table (stores which users belong to which cohorts)
CREATE TABLE IF NOT EXISTS cohort_members  (
    cohort_id UUID,
    website_id String,
    identity_id String,
    -- Additional metadata about the membership
    first_qualified_at DateTime,
    last_qualified_at DateTime,
    qualification_count UInt32 DEFAULT 1,
    -- JSON with specific metrics that qualified the user
    metrics String,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (cohort_id, identity_id, website_id);

-- Cohort snapshots (historical data for retention analysis)
CREATE TABLE IF NOT EXISTS cohort_snapshots (
    snapshot_id UUID DEFAULT generateUUIDv4(),
    cohort_id UUID,
    website_id String,
    snapshot_date Date,
    total_members UInt32,
    new_members UInt32,
    churned_members UInt32,
    -- JSON with detailed metrics
    metrics String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (cohort_id, snapshot_date);`,
  });
  return resp;
};

const createMateralizedViewsForPerformance = async (clickHouseClient) => {
  const resp = await clickHouseClient.query({
    query: `-- User profiles (aggregated from events)
CREATE TABLE IF NOT EXISTS user_profiles (
    identity_id String,
    website_id String,
    email String,
    first_seen_at DateTime,
    last_seen_at DateTime,
    total_sessions UInt32,
    total_events UInt32,
    -- Geographic info from most recent event
    country String,
    region String,
    city String,
    timezone String,
    -- Technical info from most recent event
    device_type Enum8('desktop' = 1, 'mobile' = 2, 'tablet' = 3),
    browser_name String,
    os_name String,
    -- Behavioral metrics
    total_content_views UInt32,
    unique_content_count UInt32,
    avg_session_duration Float64,
    -- JSON with detailed history
    behavior_metrics String,
    updated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (website_id, identity_id);

-- Materialized view to maintain user profiles
CREATE MATERIALIZED VIEW user_profiles_mv TO user_profiles AS
SELECT 
    identity_id,
    website_id,
    anyLast(email) as email,
    min(created_at) as first_seen_at,
    max(created_at) as last_seen_at,
    countDistinct(session_id) as total_sessions,
    count(*) as total_events,
    anyLast(country) as country,
    anyLast(region) as region,
    anyLast(city) as city,
    anyLast(timezone) as timezone,
    multiIf(
        max(viewport_width) >= 1024, 'desktop',
        max(viewport_width) >= 768, 'tablet', 
        'mobile'
    ) as device_type,
    anyLast(browser_name) as browser_name,
    anyLast(os_name) as os_name,
    countIf(event_name = 'content-viewed') as total_content_views,
    countDistinctIf(content_id, event_name = 'content-viewed') as unique_content_count,
    -- Simplified session duration calculation
        avgIf(session_duration, session_duration > 0) as avg_session_duration,
    jsonSerialize(
        map(
            'last_content_viewed', anyLastIf(content_id, event_name = 'content-viewed'),
            'favorite_browser', argMax(browser_name, created_at),
            'active_hours', groupArrayDistinct(toHour(created_at))
        )
    ) as behavior_metrics
FROM (
    SELECT *,
        -- Calculate session duration (simplified)
        max(created_at) OVER (PARTITION BY session_id) - 
        min(created_at) OVER (PARTITION BY session_id) as session_duration
    FROM events
    WHERE identity_id != ''
)
GROUP BY identity_id, website_id;`,
  });
  return resp;
};

const createCohortAggregationTables = async (clickHouseClient) => {
  const resp = await clickHouseClient.query({
    query: `
-- Daily user activity summary
CREATE TABLE IF NOT EXISTS daily_user_activity (
    date Date,
    website_id String,
    identity_id String,
    session_count UInt16,
    event_count UInt32,
    content_view_count UInt32,
    unique_content_count UInt16,
    total_duration UInt32, -- in seconds
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (website_id, identity_id, date);

-- Geographic distribution summary
CREATE TABLE IF NOT EXISTS user_geography (
    website_id String,
    identity_id String,
    primary_country String,
    primary_region String,
    primary_city String,
    primary_timezone String,
    country_count UInt8,
    region_count UInt8,
    last_location_at DateTime,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (website_id, identity_id);

-- Device and technology usage
CREATE TABLE IF NOT EXISTS user_technology (
    website_id String,
    identity_id String,
    primary_device Enum8('desktop' = 1, 'mobile' = 2, 'tablet' = 3),
    primary_browser String,
    primary_os String,
    device_count UInt8,
    browser_count UInt8,
    os_count UInt8,
    last_technology_at DateTime,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (website_id, identity_id);

`,
  });
  return resp;
};
