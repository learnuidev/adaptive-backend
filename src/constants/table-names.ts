import dotenv from "dotenv";
dotenv.config();

/* eslint-disable no-undef */
export const tableNames = {
  usersTable: process.env.USERS_TABLE,
  userPreferenceTable: process.env.USER_PREFERENCE_TABLE,
  eventsTable: process.env.EVENTS_TABLE,
  featureTable: process.env.FEATURE_TABLE,
  featureVersionTable: process.env.FEATURE_VERSION_TABLE,
  identityTable: process.env.IDENTITY_TABLE,
  userCredentialsTable: process.env.USER_CREDENTIALS_TABLE || "",
  cohortTable: process.env.COHORT_TABLE,
  notesTable: process.env.NOTES_TABLE,
  apiKeysTable: process.env.API_KEYS_TABLE,
  teamInvitationTable: process.env.TEAM_INVITATIONS_TABLE,
  teamMembersTable: process.env.TEAM_MEMBERS_TABLE,
};

export default {
  tableNames,
};
