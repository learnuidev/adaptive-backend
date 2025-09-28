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
  getFunnelData,
  hasUserEvents,
} from "./events.js";

import dotenv from "dotenv";
dotenv.config();

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

export const clickhouse = (params: any) => {
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
    hasUserEvents,
    // Query Functions
    getTotalViewsByWebsiteId,
    getTotalVisitorsByGeo,
    getFunnelData,
  };
};

export { clickhouse as default };
