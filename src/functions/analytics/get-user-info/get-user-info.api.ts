import { getUserInfo } from "../../../adaptive-research/get-user-info.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getUserWebsiteById } from "../../user-websites/get-user-website-by-id.api.js";

export const getUserInfoApi = async (params: {
  websiteId: string;
  email: string;
}) => {
  const { websiteId, email } = params;

  const website = await getUserWebsiteById(websiteId);

  const timezoneName = website?.timezoneName || "America/Montreal";

  const userInfo = await getUserInfo({
    websiteId,
    clickHouseClient: clickhouseClient.client,

    email,
  });

  return userInfo;
};
