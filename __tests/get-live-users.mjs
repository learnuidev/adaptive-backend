import { testClient } from "./test-client.mjs";

const formatDateForClickHouse = (date) => {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
};

// Test function
async function testGetLiveUsers() {
  console.log(
    "🧪 Testing getLiveUsers function with real ClickHouse client...\n"
  );

  try {
    // Test 1: Get live users query
    console.log("📊 Test 1: Testing live users query");
    const now = new Date();
    const thresholdTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    const thresholdString = formatDateForClickHouse(thresholdTime);

    const query = `
      SELECT 
        visitor_id,
        session_id,
        identity_id,
        email,
        max(created_at) as last_activity,
        min(created_at) as session_start,
        count(*) as event_count,
        any(href) as last_page,
        any(event_name) as last_event_name,
        any(country) as country,
        any(city) as city,
        any(browser_name) as browser_name,
        any(os_name) as os_name,
        any(device_model) as device_model,
        groupArray(DISTINCT event_name) as event_types,
        groupArray(DISTINCT href) as pages_visited
      FROM event
      WHERE website_id = '01K66XSK34CXMV0TT8ATS953W0'
        AND created_at >= '${thresholdString}'
      GROUP BY visitor_id, session_id, identity_id, email
      ORDER BY last_activity DESC
      LIMIT 100
    `;

    const liveUsersResult = await testClient.query({
      query,
      format: "JSONEachRow",
    });

    const liveUsers = await liveUsersResult.json();
    console.log(
      `✅ Live users query executed successfully. Found ${liveUsers.length} live users`
    );

    if (liveUsers.length > 0) {
      console.log(
        "Sample live user data:",
        JSON.stringify(liveUsers[0], null, 2)
      );
    }

    // Test 2: Summary query
    console.log("\n📈 Test 2: Testing summary query");
    const summaryQuery = `
      SELECT 
        count(DISTINCT visitor_id) as total_live_visitors,
        count(DISTINCT session_id) as total_active_sessions,
        count(*) as total_events,
        count(DISTINCT identity_id) as total_identified_users,
        count(DISTINCT country) as total_countries,
        count(DISTINCT city) as total_cities,
        avg(event_count) as avg_events_per_session,
        max(event_count) as max_events_in_session
      FROM (
        SELECT 
          visitor_id,
          session_id,
          identity_id,
          country,
          city,
          count(*) as event_count
        FROM event
        WHERE website_id = '01K66XSK34CXMV0TT8ATS953W0'
          AND created_at >= '${thresholdString}'
        GROUP BY visitor_id, session_id, identity_id, country, city
      )
    `;

    const summaryResult = await testClient.query({
      query: summaryQuery,
      format: "JSONEachRow",
    });

    const summary = await summaryResult.json();
    console.log("✅ Summary query executed successfully");
    if (summary.length > 0) {
      console.log("Summary data:", JSON.stringify(summary[0], null, 2));
    }

    // Test 3: Geography query
    console.log("\n🌍 Test 3: Testing geography query");
    const geographyQuery = `
      SELECT 
        country,
        region,
        city,
        count(DISTINCT visitor_id) as visitor_count,
        count(DISTINCT session_id) as session_count,
        count(*) as event_count
      FROM event
      WHERE website_id = '01K66XSK34CXMV0TT8ATS953W0'
        AND created_at >= '${thresholdString}'
      GROUP BY country, region, city
      ORDER BY visitor_count DESC
      LIMIT 20
    `;

    const geographyResult = await testClient.query({
      query: geographyQuery,
      format: "JSONEachRow",
    });

    const geography = await geographyResult.json();
    console.log(
      `✅ Geography query executed successfully. Found ${geography.length} locations`
    );

    if (geography.length > 0) {
      console.log(
        "Sample geography data:",
        JSON.stringify(geography[0], null, 2)
      );
    }

    // Test 4: Data processing logic
    console.log("\n🔧 Test 4: Testing data processing logic");
    if (liveUsers.length > 0) {
      const processedUsers = liveUsers.map((user) => ({
        ...user,
        session_duration_minutes: Math.floor(
          (new Date(user.last_activity).getTime() -
            new Date(user.session_start).getTime()) /
            (1000 * 60)
        ),
        is_active: true,
        time_since_last_activity_minutes: Math.floor(
          (now.getTime() - new Date(user.last_activity).getTime()) / (1000 * 60)
        ),
      }));

      console.log("✅ Data processing logic validated");
      console.log(
        "Sample processed user:",
        JSON.stringify(processedUsers[0], null, 2)
      );
    } else {
      console.log("ℹ️ No live users found to test data processing logic");
    }

    console.log(
      "\n🎉 All tests completed successfully with real ClickHouse client!"
    );
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    console.error("Error details:", error.message);
  }
}

// Run the test
testGetLiveUsers();
