import { createClient } from "@clickhouse/client";

// Event Stuff
import {
  cleanEventTable,
  createEventTable,
  deleteEventTable,
  getFunnelData,
  getTotalViewsByWebsiteId,
  // Queries
  getTotalVisitorsByGeo,
  hasUserEvents,
  ingestDDBEvent,
  ingestDDBEvents,
  listEventsByWebsiteId,
  mapDDBEvent,
} from "./events.js";

import {
  getLiveUsersByWebsiteId,
  getLiveUserSummaryByWebsiteId,
  getLiveUsersByGeography,
} from "./get-live-users-by-website-id.js";

import dotenv from "dotenv";
dotenv.config();

// IDentity Stuff
import {
  cleanIdentityTable,
  createIdentityTable,
  deleteIdentityTable,
  ingestDDBIdentities,
  ingestDDBIdentity,
  listIdentitiesByEmail,
  listIdentitiesByWebsiteId,
  mapDDBIdentity,
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
    hasUserEvents,
    // Query Functions
    getTotalViewsByWebsiteId,
    getTotalVisitorsByGeo,
    getFunnelData,
    // Live User Functions
    getLiveUsersByWebsiteId,
    getLiveUserSummaryByWebsiteId,
    getLiveUsersByGeography,
  };
};

export { clickhouse as default };
