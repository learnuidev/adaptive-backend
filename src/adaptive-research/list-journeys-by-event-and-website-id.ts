import { ClickHouseClient } from "@clickhouse/client";

export interface ListJourneysByEventAndWebsiteIdInput {
  clickHouseClient: ClickHouseClient;
  eventId: string;
  websiteId: string;
  goalName?: string;
  selectedKeys?: string[];
}

export async function listJourneyByEventAndWebsiteId({
  clickHouseClient,
  eventId,
  websiteId,
  goalName,
  selectedKeys = ["*"],
}: ListJourneysByEventAndWebsiteIdInput) {
  // First, fetch the goal event to get the visitor_id, session_id and created_at
  const goalEventQuery = `
    SELECT visitor_id, session_id, created_at
    FROM event
    WHERE id = {eventId:String}
      AND website_id = {websiteId:String}
      ${goalName ? "AND metadata['eventName'] = {goalName:String}" : ""}
    LIMIT 1
  `;
  const goalEventResult = await clickHouseClient.query({
    query: goalEventQuery,
    query_params: { eventId, websiteId, ...(goalName && { goalName }) },
    format: "JSONEachRow",
  });
  const goalEventRows = await goalEventResult.json();
  if (!goalEventRows.length) {
    return [];
  }
  const {
    visitor_id,
    session_id,
    created_at: goalCreatedAt,
  } = goalEventRows[0];

  let selectFields;
  if (selectedKeys.length === 1 && selectedKeys[0] === "*") {
    selectFields = "*";
  } else {
    selectFields = selectedKeys
      .map((key) => {
        switch (key) {
          case "id":
            return "id";
          case "email":
            return "email";
          case "eventName":
            return "metadata['eventName'] AS eventName";
          case "created_at":
            return "created_at";
          default:
            return key;
        }
      })
      .filter(Boolean)
      .join(",\n      ");
  }

  // Fetch all events for this visitor and session up to the goal event time
  const journeyQuery = `
    SELECT
      ${selectFields}
    FROM event
    WHERE visitor_id = {visitorId:String}
      AND session_id = {sessionId:String}
      AND website_id = {websiteId:String}
      AND created_at <= {goalCreatedAt:String}
    ORDER BY created_at ASC
  `;

  const journeyResult = await clickHouseClient.query({
    query: journeyQuery,
    query_params: {
      visitorId: visitor_id,
      sessionId: session_id,
      websiteId,
      goalCreatedAt,
    },
    format: "JSONEachRow",
  });

  const rows = await journeyResult.json();

  if (selectedKeys.length === 1 && selectedKeys[0] === "*") {
    return rows;
  }

  return rows.map((row) => {
    const mapped = {};
    selectedKeys.forEach((key) => {
      if (key === "eventName") {
        mapped.eventName = row.eventName;
      } else if (key in row) {
        mapped[key] = row[key];
      }
    });
    return mapped;
  });
}
