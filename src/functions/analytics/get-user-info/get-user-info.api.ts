import { getUserInfo } from "../../../adaptive-research/get-user-info.js";
import { clickhouseClient } from "../../../lib/clickhouse-client.js";
import { getUserCredentialById } from "../../user-credentials/get-user-credential-by-id.api.js";

export const getUserInfoApi = async (params: {
  websiteId: string;
  email: string;
}) => {
  const { websiteId, email } = params;

  const website = await getUserCredentialById(websiteId);

  const timezoneName = website?.timezoneName || "America/Montreal";

  const userInfo = await getUserInfo({
    websiteId,
    clickHouseClient: clickhouseClient.client,

    email,
  });

  return userInfo;
};
