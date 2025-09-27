import { UAParser } from "ua-parser-js";

export const extractDeviceInfo = (userAgentString) => {
  const parser = new UAParser(userAgentString);
  const uaResult = parser.getResult();

  const os = `${uaResult.os?.name || ""}_${uaResult.os?.version || ""}`;
  const device = `${uaResult.device?.model || ""}_${uaResult.device?.vendor || ""}`;
  const browser = `${uaResult.browser?.name || ""}_${uaResult.browser?.version || ""}`;

  const deviceType = `${os}#${device}#${browser}`;

  return {
    os_name: uaResult.os?.name,
    os_version: uaResult.os?.version,
    device_model: uaResult.device?.model,
    device_vendor: uaResult.device?.vendor,
    browser_name: uaResult.browser?.name,
    browser_version: uaResult.browser?.version,
    deviceType,
  };
};
