import geoip from "geoip-lite";

export const extractLocationInfo = (ipAddress) => {
  const sample = {
    // eu: "0",
    // ll: [39.018, -77.539],
    // area: 20,
    country: "US",
    city: "Ashburn",
    timezone: "America/New_York",
    // metro: 511,
    // range: [764441088, 764441599],
    region: "VA",
  };

  const location = geoip.lookup(ipAddress);

  return {
    country: location?.country,
    city: location?.city,
    timezone: location?.timezone,
    region: location?.region,
    // Extra Info

    latitude: location?.ll?.[0],
    longitude: location?.ll?.[1],
  };
};
