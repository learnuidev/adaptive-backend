require("dotenv").config();

/* eslint-disable no-undef */
const tableNames = {
  usersTable: process.env.USERS_TABLE,
  userPreferenceTable: USER_PREFERENCE_TABLE,
  analyticsTable: process.env.ANALYTICS_TABLE,
  featureFlagsTable: process.env.FEATURE_FLAGS_TABLE,
};

module.exports = {
  tableNames,
};
