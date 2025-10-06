# AWS Infrastructure

The project uses Serverless Framework with these resources:

- **DynamoDB Tables:** IdentityTableV2, EventsTableV2, FeatureTableV2, FeatureVersionTable, UserCredentialsTable, ApiKeysTable, CohortTable, NotesTable, UsersTable, UserPreferenceTable
- **Cognito User Pool:** User authentication with email-based sign-up
- **KMS Key:** For encryption/decryption operations
- **API Gateway:** RESTful API endpoints with CORS enabled

## Environment Variables

- Region-specific configuration
- Stage-based deployment (dev, prod)
- Table names and resource ARNs
- Log levels per environment
