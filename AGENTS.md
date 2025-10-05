# AGENTS.md

## 1. Project Overview

This project is a modern Serverless AWS analytics backend using:

- **DynamoDB** for storing application data (events, features, users, cohorts, notes)
- **Clickhouse DB** for storing and querying analytics data
- **AWS Lambda** for serverless functions
- **API Gateway** for exposing RESTful APIs
- **TypeScript** for type safety with ES modules
- **Zod** for schema validation
- **Middy** for Lambda middleware
- **AWS Cognito** for user authentication and authorization
- **KMS** for encryption/decryption operations

Follow these conventions for human and AI contributors. Only use approved dependencies.

---

## 2. Development Guidelines

- Write all source in TypeScript (`.ts`), not JavaScript
- Use ES modules with `.js` extensions in imports
- Use Zod for all schemas: API validation, data guardrails, and type definitions
- Use Middy middleware for Lambda functions (CORS, error handling)
- Separate API logic from handler logic (`.api.ts` files)
- Validate all user input with Zod schemas
- Use ULID for generating unique IDs
- Update data immutably—never mutate directly
- Try to duplicate code as little as possible and keep it DRY

### 2.1 Directory Structure

All the source code is defined in `/src` directory. Breakdown of subdirectories:

- `/src/adaptive-research`: Contains research and analytics logic for Clickhouse DB integration, including cohort analysis, funnel tracking, and trend generation
- `/src/constants`: All the constant values used in the application (API config, table names)
- `/src/functions`: Lambda functions organized by domain:
  - `/analytics`: Analytics endpoints (events, features, cohorts, journeys, notes)
  - `/api-keys`: API key management (create, list, get, rotate, delete)
  - `/auth`: Authorization and authentication handlers
  - `/user`: User management functions
  - `/user-websites`: User website management (add, list, get, update, delete)
- `/src/lib`: Contains third-party libraries and utilities:
  - `clickhouse-client.ts`: Clickhouse DB client wrapper
  - `crypto-v2.ts`: Encryption/decryption utilities
- `/src/utils`: General-purpose utility functions:
  - `construct-params.ts`: Parameter construction utilities
  - `extract-device-info.ts`: Device information extraction
  - `extract-location-info.ts`: Location information extraction
  - `remove-null.ts`: Null value removal utilities

### 2.2 Lambda Function Structure

Each Lambda function follows this pattern:

- `handler.ts`: Main Lambda handler with Middy middleware
- `api.ts`: Core business logic and database operations
- Separate schema validation using Zod
- Error handling with proper HTTP status codes

### 2.3 Middy Middleware Usage

All Lambda handler functions must be wrapped with Middy middleware to handle CORS:

```typescript
import middy from "@middy/core";
import cors from "@middy/http-cors";

export const handler = middy(async (event: any) => {
  // Handler logic here
}).use(cors());
```

This ensures proper CORS headers are added to all API responses.

---

## 3. Naming Conventions

Always use kebab-case for file names and function names.

- **Function Files:** Use kebab-case for the file, matching the function (`add-feature.ts` for `addFeature`)
- **API Files:** Use kebab-case with `.api.ts` suffix (`add-feature.api.ts`)
- **Handler Functions:** camelCase (`addFeature`, `listFeatures`)
- **Schema Types:** PascalCase (`AddFeatureInput`, `Feature`)
- **Constants:** kebab-case (`tableNames`, `apiConfig`)
- **Utility Files:** kebab-case (`construct-params.ts`, `extract-device-info.ts`)

---

## 4. AWS Infrastructure

The project uses Serverless Framework with these resources:

- **DynamoDB Tables:** IdentityTableV2, EventsTableV2, FeatureTableV2, FeatureVersionTable, UserCredentialsTable, ApiKeysTable, CohortTable, NotesTable, UsersTable, UserPreferenceTable
- **Cognito User Pool:** User authentication with email-based sign-up
- **KMS Key:** For encryption/decryption operations
- **API Gateway:** RESTful API endpoints with CORS enabled

### 4.1 Environment Variables

- Region-specific configuration
- Stage-based deployment (dev, prod)
- Table names and resource ARNs
- Log levels per environment

---

## 5. Security & Performance

- Validate all user input with Zod schemas
- Use AWS Cognito for authentication and authorization
- Implement proper error handling with HTTP status codes
- Use KMS for sensitive data encryption
- Enable CORS for all endpoints
- Use environment-based log levels
- Implement proper IAM roles per function
- Use DynamoDB streams for event-driven architecture

---

## 6. Development Workflow

- Build: `npm run build` (TypeScript compilation)
- Deploy to EU: `npm run deploy:eu`
- Deploy to US: `npm run deploy:us`
- All functions build to `/dist` directory
- Use Serverless Framework for infrastructure as code

## Documentation Standards

- Include inline documentation for complex business logic
- Keep function parameters and return types well-documented
- Update this AGENTS.md when adding new patterns or conventions
- Document schema definitions with Zod
