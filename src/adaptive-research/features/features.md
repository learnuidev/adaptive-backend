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

### FeatureVersion & Rollout

Each feature can have multiple versions; one is marked as `active`.  
A version’s rollout defines how it is gradually released to users.

| Field             | Type     | Description                                                                                |
| ----------------- | -------- | ------------------------------------------------------------------------------------------ |
| id                | UUID     | Unique identifier for the version                                                          |
| featureId         | UUID     | Parent feature ID                                                                          |
| version           | String   | Semantic version string (e.g., 1.2.3)                                                      |
| config            | JSON     | Arbitrary payload delivered to clients when version is active                              |
| isActive          | Boolean  | Whether this version is currently served to users                                          |
| rolloutPercentage | Integer  | 0–100; percentage of users who receive this version (null until rollout is created)        |
| rolloutRules      | JSON[]   | Optional audience targeting rules that override the percentage (null until rollout exists) |
| createdAt         | DateTime | Timestamp of version creation                                                              |
| createdBy         | UUID     | ID of the user who created the version                                                     |
| updatedAt         | DateTime | Timestamp of last update                                                                   |
| updatedBy         | UUID     | ID of the user who last updated the version                                                |

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
