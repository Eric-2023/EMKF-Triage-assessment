# EMKF Paramedic Triage Intake App

An offline-first mobile application for paramedics to log critical patient
triage data instantly in the field — even without internet connectivity.
Built for the Emergency Medicine Kenya Foundation (EMKF) technical assessment.

**Stack:** React Native · Expo SDK 54 · TypeScript · Redux Toolkit · expo-sqlite

---

## Screenshots

_(add screenshots here after recording demo)_

---

## Architecture Overview
src/
├── types/
│   └── triage.ts          TypeScript interfaces + priority color mapping
├── db/
│   └── database.ts        SQLite persistence layer (init, save, query, update)
├── services/
│   ├── mockApi.ts         Simulated backend API (2s delay, 20% failure rate)
│   └── syncService.ts     Background sync queue + NetInfo connectivity listener
├── store/
│   ├── store.ts           Redux store configuration
│   └── triageSlice.ts     Triage records state + sync status management
└── components/
├── PrioritySelector.tsx   Color-coded P1–P5 priority picker
├── SyncStatusBar.tsx      Pending/syncing status banner
└── TriageForm.tsx         Main triage intake form with validation

---

## How the Offline-First Sync Queue Works

This is the core architectural requirement of the assessment. The flow:

1. **Paramedic submits a triage record**
2. **Record is saved to SQLite immediately** — regardless of connectivity.
   No data is ever lost, even if the device has no signal.
3. **NetInfo checks connectivity** at submission time:
   - **Online** → `triggerSync()` is called immediately, record uploads
     to the mock API in the background
   - **Offline** → record stays in SQLite with `syncStatus: 'pending'`,
     UI shows "Offline — record saved locally. Will sync automatically
     when connected."
4. **NetInfo listener fires** the moment connectivity is restored →
   `runSyncQueue()` reads all `pending` / `failed` records from SQLite
   and uploads them sequentially to the mock API
5. **On success** → record marked `synced` in both SQLite and Redux store,
   `pendingCount` decrements, banner disappears when queue is empty
6. **On failure** → record marked `failed`, will be retried on the next
   connectivity event automatically

The sync runs sequentially (not in parallel) so each failure is handled
independently and the mock server isn't flooded.

---

## Priority Color Coding

Critical cases stand out visually per the spec's UI requirement:

| Priority | Label | Color |
|----------|-------|-------|
| P1 | CRITICAL | Deep red `#B91C1C` |
| P2 | EMERGENT | Orange `#EA580C` |
| P3 | URGENT | Amber `#D97706` |
| P4 | LESS URGENT | Green `#16A34A` |
| P5 | NON-URGENT | Blue `#2563EB` |

---

## State Management

Redux Toolkit manages all application state with a single `triageSlice`:

- `records` — all triage records (loaded from SQLite on startup)
- `pendingCount` — number of unsynced records (drives the SyncStatusBar)
- `isSyncing` — whether a sync is currently in progress

The sync service communicates with Redux via a registered callback
(not a direct store import) to avoid circular dependency issues.

---

## Mock API

Per the spec, no real backend is required. `src/services/mockApi.ts`
simulates `POST /api/v1/triage` with:

- **2-second artificial delay** to simulate real network latency
- **20% random failure rate** to prove the sync queue handles retries
- Deterministic testing via `jest.spyOn(Math, 'random')` in unit tests

---

## Prerequisites

- Node.js 18+
- Expo Go app installed on your phone
  ([iOS](https://apps.apple.com/app/expo-go/id982107779) /
  [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

---

## Setup & Running Locally

```bash
git clone https://github.com/Eric-2023/EMKF-Triage-assessment.git
cd EMKF-Triage-assessment
npm install
npx expo start
```

Scan the QR code with your phone camera (iOS) or the Expo Go app (Android).

---

## Running Tests

```bash
npx jest
```

16 tests across 2 test suites:
- `__tests__/triageSlice.test.ts` — Redux state logic (11 tests)
- `__tests__/mockApi.test.ts` — Mock API behavior and failure simulation (5 tests)

---

## Design Decisions & Trade-offs

**expo-sqlite over MMKV**
SQLite gives structured querying — specifically the ability to
`SELECT WHERE syncStatus = 'pending'` which is exactly what the sync
queue needs. MMKV is faster for simple key-value storage but would
require manual filtering in JS. SQLite's query capability is worth
the marginal overhead here.

**Redux Toolkit over Context API**
The spec requires a production-grade state library. RTK gives
predictable state updates, built-in Immer immutability, and
DevTools support. Context API would work for this scope but
doesn't demonstrate the same engineering depth.

**Callback pattern for sync → Redux communication**
The sync service needs to update Redux when records sync. Importing
the store directly into `syncService.ts` creates a circular dependency
(store → slice → service → store). Instead, `App.tsx` registers a
callback via `registerSyncCallback()` that the sync service calls
— clean separation of concerns, no circular imports.

**Sequential sync queue, not parallel**
Uploading records one at a time means a single failure doesn't block
others, each failure is logged independently, and the mock server
isn't hit with concurrent requests. The trade-off is slightly slower
bulk sync, which doesn't matter for the record volumes a paramedic
would generate in the field.

**StyleSheet.create() over NativeWind**
NativeWind v4 has known setup friction with Expo Go SDK 54.
Given the time constraints of this assessment, plain StyleSheet
is more reliable and matches existing HomePurse/Cakeland patterns.
The UI achieves all required visual goals without a CSS framework.

---

## Libraries Used

| Library | Reason |
|---------|--------|
| `expo-sqlite` | Local persistence — structured queries for sync queue |
| `@react-native-community/netinfo` | Connectivity monitoring for auto-sync trigger |
| `@reduxjs/toolkit` | Production-grade state management with Immer |
| `react-redux` | React bindings for Redux store |
| `expo-crypto` | UUID generation compatible with Expo Go (no polyfills needed) |
| `jest-expo` | Jest preset for React Native/Expo testing environment |

---

## Git Discipline

Commits follow Conventional Commits convention (`feat:`, `fix:`,
`chore:`, `test:`, `docs:`) with one logical concern per commit,
matching the incremental build order of the application.