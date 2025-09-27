import { createClient } from "@clickhouse/client";

// Event Stuff
import {
  mapDDBEvent,
  createEventTable,
  cleanEventTable,
  deleteEventTable,
  ingestDDBEvent,
  ingestDDBEvents,
  listEventsByWebsiteId,
  listEventByEmail,

  // Queries
  getTotalVisitorsByGeo,
  getTotalViewsByWebsiteId,
  getTotalPageVisitsByWebsiteId,
  getFunnelData,
  listPagesByWebsiteId,
} from "./events.js";

// IDentity Stuff
import {
  createIdentityTable,
  ingestDDBIdentities,
  ingestDDBIdentity,
  mapDDBIdentity,
  cleanIdentityTable,
  deleteIdentityTable,
  listIdentitiesByWebsiteId,
  listIdentitiesByEmail,
} from "./identity.js";
import "dotenv/config";

export const clickhouse = (params) => {
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
    listPagesByWebsiteId,
  };
};

export { clickhouse as default };
