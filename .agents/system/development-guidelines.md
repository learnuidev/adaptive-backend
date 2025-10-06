# Development Guidelines

- Write all source in TypeScript (`.ts`), not JavaScript
- Use ES modules with `.js` extensions in imports
- Use Zod for all schemas: API validation, data guardrails, and type definitions
- Use Middy middleware for Lambda functions (CORS, error handling)
- Separate API logic from handler logic (`.api.ts` files)
- Validate all user input with Zod schemas
- Use ULID for generating unique IDs
- Update data immutably—never mutate directly
- Try to duplicate code as little as possible and keep it DRY

## Directory Structure

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

## Lambda Function Structure

Each Lambda function follows this pattern:

- `handler.ts`: Main Lambda handler with Middy middleware
- `api.ts`: Core business logic and database operations
- Separate schema validation using Zod
- Error handling with proper HTTP status codes

## Middy Middleware Usage

All Lambda handler functions must be wrapped with Middy middleware to handle CORS:

```typescript
import middy from "@middy/core";
import cors from "@middy/http-cors";

export const handler = middy(async (event: any) => {
  // Handler logic here
}).use(cors());
```

This ensures proper CORS headers are added to all API responses.
