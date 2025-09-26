require("dotenv").config();

/* eslint-disable no-undef */
const tableNames = {
  usersTable: process.env.USERS_TABLE,
  userPreferenceTable: process.env.USER_PREFERENCE_TABLE,
  eventsTable: process.env.EVENTS_TABLE,
  featureFlagsTable: process.env.FEATURE_FLAGS_TABLE,
  identityTable: process.env.IDENTITY_TABLE,
};

module.exports = {
  tableNames,
};
