import dotenv from "dotenv";
dotenv.config();

import { clickhouse } from "../adaptive-research/clickhouse.js";

let clickhouseClient: any;

// testing
const params = {
  // eslint-disable-next-line no-undef
  url: process.env.CLICKHOUSE_URL,
  // eslint-disable-next-line no-undef
  username: process.env.CLICKHOUSE_USERNAME,
  // eslint-disable-next-line no-undef
  password: process.env.CLICKHOUSE_PASSWORD,
};

if (!clickhouseClient) {
  clickhouseClient = clickhouse(params);
}

export { clickhouseClient };
