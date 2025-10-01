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
  userCredentialsTable: process.env.USER_CREDENTIALS_TABLE,
};

export default {
  tableNames,
};
