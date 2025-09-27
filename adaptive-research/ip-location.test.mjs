import geoip from "geoip-lite";

const ip = "204.48.76.246";
const resp = geoip.lookup(ip);
console.log("ip", resp);

const sampleResponse = {
  range: [3425714176, 3425718271],
  country: "CA",
  region: "QC",
  eu: "0",
  timezone: "America/Toronto",
  city: "Montreal",
  ll: [45.5059, -73.631],
  metro: 0,
  area: 50,
};
