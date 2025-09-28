import dotenv from "dotenv";
import { createClient } from "@clickhouse/client";

dotenv.config();

const params = {
  // eslint-disable-next-line no-undef
  url: process.env.CLICKHOUSE_URL,
  // eslint-disable-next-line no-undef
  username: process.env.CLICKHOUSE_USERNAME,
  // eslint-disable-next-line no-undef
  password: process.env.CLICKHOUSE_PASSWORD,
};

export const testClient = createClient(params);
