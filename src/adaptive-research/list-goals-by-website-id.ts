import { ClickHouseClient } from "@clickhouse/client";
import { buildDateRange, FilterPeriod } from "./utils.js";

interface ListGoalsByWebsiteIdInput {
  clickHouseClient: ClickHouseClient;
  websiteId: string;
  period?: FilterPeriod;
  from?: Date;
  to?: Date;
  selectedKeys?: string[];
}
export async function listGoalsByWebsiteId({
  clickHouseClient,
  websiteId,
  period = "all",
  from,
  to,
  selectedKeys = ["id", "email", "goalName", "created_at"],
}: ListGoalsByWebsiteIdInput) {
  const { startStart: start } = buildDateRange({ period, from, to });

  let selectFields;

  // If selectedKeys is [*], select everything
  if (selectedKeys.length === 1 && selectedKeys[0] === "*") {
    selectFields = "*";
  } else {
    // Build SELECT clause dynamically based on selectedKeys
    selectFields = selectedKeys
      .map((key) => {
        switch (key) {
          case "id":
            return "id";
          case "email":
            return "email";
          case "goalName":
            return "metadata['eventName'] AS goalName";
          case "created_at":
            return "created_at";
          case "initiatedAt":
            return "created_at AS initiatedAt";
          default:
            // Allow any key that exists as a column in the event table
            return key;
        }
      })
      .filter(Boolean)
      .join(",\n      ");
  }

  const query = `
    SELECT
      ${selectFields}
    FROM event
    WHERE website_id = {websiteId:String}
      AND metadata['eventName'] != ''
      AND email IS NOT NULL
      AND created_at >= {start:String}
    ORDER BY created_at DESC
  `;

  const result = await clickHouseClient.query({
    query,
    query_params: { websiteId, start },
    format: "JSONEachRow",
  });

  const rows = await result.json();

  // If selectedKeys is [*], return rows as-is
  if (selectedKeys.length === 1 && selectedKeys[0] === "*") {
    return rows;
  }

  // Map rows to include only selected keys
  return rows.map((row) => {
    const mapped = {};
    selectedKeys.forEach((key) => {
      if (key === "goalName") {
        mapped.goalName = row.goalName;
      } else if (key === "initiatedAt") {
        mapped.initiatedAt = row.initiatedAt || row.created_at;
      } else if (key === "created_at") {
        mapped.created_at = row.created_at;
      } else if (key in row) {
        mapped[key] = row[key];
      }
    });
    return mapped;
  });
}
