# Features

Features in adaptive allows you to manage entire lifecycle of the feature.

This includes:

- Creating a feature
- Manging feature versions
- Managing how a feature is released (via a feature called feature release)
- Conducting A/B tests for a feature versions
- Monitoring the performance of a feature version
- Rolling back a feature version
- Disabling a feature version

## Data Model

### Feature

Represents the top-level container for a feature.

| Field       | Type     | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| id          | UUID     | Unique identifier for the feature              |
| name        | String   | Human-readable name (unique within workspace)  |
| key         | String   | Machine-readable key (unique within workspace) |
| description | String   | Optional long-form description                 |
| tags        | String[] | Optional list of tags for grouping/filtering   |
| createdAt   | DateTime | Timestamp of creation                          |
| createdBy   | UUID     | ID of the user who created the feature         |
| updatedAt   | DateTime | Timestamp of last update                       |
| updatedBy   | UUID     | ID of the user who last updated the feature    |

---

### FeatureVersion

Each feature can have multiple versions; one is marked as `active`.

| Field             | Type     | Description                                                   |
| ----------------- | -------- | ------------------------------------------------------------- |
| id                | UUID     | Unique identifier for the version                             |
| featureId         | UUID     | Parent feature ID                                             |
| version           | String   | Semantic version string (e.g., 1.2.3)                         |
| config            | JSON     | Arbitrary payload delivered to clients when version is active |
| isActive          | Boolean  | Whether this version is currently served to users             |
| rolloutPercentage | Integer  | 0–100; percentage of users who receive this version           |
| rolloutRules      | JSON[]   | Optional audience targeting rules (overrides percentage)      |
| createdAt         | DateTime | Timestamp of version creation                                 |
| createdBy         | UUID     | ID of the user who created the version                        |
| updatedAt         | DateTime | Timestamp of last update                                      |
| updatedBy         | UUID     | ID of the user who last updated the version                   |

---

### FeatureRelease

A release groups one or more versions for progressive rollout or A/B testing.

| Field        | Type     | Description                                                |
| ------------ | -------- | ---------------------------------------------------------- |
| id           | UUID     | Unique identifier for the release                          |
| featureId    | UUID     | Parent feature ID                                          |
| name         | String   | Human-readable release name                                |
| description  | String   | Optional details about the release                         |
| startAt      | DateTime | Scheduled start time                                       |
| endAt        | DateTime | Optional scheduled end time                                |
| status       | Enum     | `scheduled`, `running`, `paused`, `completed`, `cancelled` |
| trafficSplit | JSON[]   | Array of `{ versionId, weight }` summing to 100            |
| createdAt    | DateTime | Timestamp of release creation                              |
| createdBy    | UUID     | ID of the user who created the release                     |
| updatedAt    | DateTime | Timestamp of last update                                   |
| updatedBy    | UUID     | ID of the user who last updated the release                |

---

### FeatureExperiment

Links a release to an A/B test and stores metric snapshots.

| Field         | Type     | Description                                              |
| ------------- | -------- | -------------------------------------------------------- |
| id            | UUID     | Unique identifier for the experiment                     |
| releaseId     | UUID     | Parent release ID                                        |
| experimentKey | String   | External experimentation platform key (e.g., Optimizely) |
| metrics       | JSON[]   | Snapshots of primary & guardrail metrics                 |
| winner        | UUID     | Optional winning versionId declared after test ends      |
| createdAt     | DateTime | Timestamp of experiment creation                         |
| createdBy     | UUID     | ID of the user who created the experiment                |
| updatedAt     | DateTime | Timestamp of last update                                 |
| updatedBy     | UUID     | ID of the user who last updated the experiment           |

---

### FeatureEvent

Immutable audit log of all state-changing operations.

| Field     | Type     | Description                                                                                                                       |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| id        | UUID     | Unique identifier for the event                                                                                                   |
| featureId | UUID     | Feature to which the event relates                                                                                                |
| versionId | UUID     | Optional version affected                                                                                                         |
| releaseId | UUID     | Optional release affected                                                                                                         |
| type      | Enum     | `created`, `version_added`, `version_activated`, `rollout_updated`, `release_started`, `release_ended`, `rolled_back`, `disabled` |
| payload   | JSON     | Serialized snapshot of the changed object                                                                                         |
| createdAt | DateTime | Timestamp of the event                                                                                                            |
| createdBy | UUID     | ID of the user who triggered the event                                                                                            |
