const { createClient } = require("@clickhouse/client");

// Event Stuff
const {
  mapDDBEvent,
  createEventTable,
  cleanEventTable,
  deleteEventTable,
  ingestDDBEvent,
  ingestDDBEvents,
  listEventsByWebsiteId,
  listEventByEmail,
  getTotalViewsByWebsiteId,
  getTotalPageVisitsByWebsiteId,
  getTotalVisitorsByGeo,
  getFunnelData,
  ...rest
} = require("./events");

// IDentity Stuff
const {
  createIdentityTable,
  ingestDDBIdentities,
  ingestDDBIdentity,
  mapDDBIdentity,
  cleanIdentityTable,
  deleteIdentityTable,
  listIdentitiesByWebsiteId,
  listIdentitiesByEmail,
} = require("./identity");
require("dotenv").config();

const clickhouse = (params) => {
  const client = createClient(params);

  return {
    client,
    // Identity
    createIdentityTable,
    ingestDDBIdentities,
    ingestDDBIdentity,
    mapDDBIdentity,
    cleanIdentityTable,
    deleteIdentityTable,
    listIdentitiesByWebsiteId,
    listIdentitiesByEmail,
    // Event
    createEventTable,
    ingestDDBEvents,
    ingestDDBEvent,
    mapDDBEvent,
    cleanEventTable,
    deleteEventTable,
    listEventsByWebsiteId,
    listEventByEmail,
    // Query Functions
    getTotalViewsByWebsiteId,
    getTotalPageVisitsByWebsiteId,
    getTotalVisitorsByGeo,
    getFunnelData,
    ...rest,
  };
};

module.exports = {
  clickhouse,
};
