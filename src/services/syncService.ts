import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getPendingRecords, updateSyncStatus } from '../db/database';
import { postTriageRecord } from './mockApi';
import { store } from '../store/store';
import { updateRecordSyncStatus } from '../store/triageSlice';

let isSyncing = false;
let unsubscribeNetInfo: (() => void) | null = null;

// Attempts to upload all pending/failed records to the mock API.
// Runs sequentially (not in parallel) so the server isn't flooded
// and so each failure can be handled independently.
const runSyncQueue = async (): Promise<void> => {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const pendingRecords = getPendingRecords();
    if (pendingRecords.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`[SyncService] Syncing ${pendingRecords.length} pending records...`);

    for (const record of pendingRecords) {
      try {
        // Mark as syncing in both SQLite and Redux store
        updateSyncStatus(record.id, 'syncing');
        store.dispatch(updateRecordSyncStatus({ id: record.id, syncStatus: 'syncing' }));

        const response = await postTriageRecord(record);

        if (response.success && response.data) {
          const syncedAt = response.data.syncedAt ?? new Date().toISOString();
          updateSyncStatus(record.id, 'synced', syncedAt);
          store.dispatch(
            updateRecordSyncStatus({ id: record.id, syncStatus: 'synced', syncedAt })
          );
          console.log(`[SyncService] Record ${record.id} synced successfully`);
        }
      } catch (error) {
        // Mark as failed — will be retried on next connectivity event
        updateSyncStatus(record.id, 'failed');
        store.dispatch(updateRecordSyncStatus({ id: record.id, syncStatus: 'failed' }));
        console.warn(`[SyncService] Record ${record.id} failed — will retry on reconnect`);
      }
    }
  } finally {
    isSyncing = false;
  }
};

// Starts the NetInfo listener. Called once on app startup.
// Triggers sync automatically the moment connectivity is restored —
// no user intervention required, per the spec's requirement.
export const startSyncService = (): void => {
  if (unsubscribeNetInfo) return; // already started

  unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
    const isConnected = state.isConnected && state.isInternetReachable;
    if (isConnected) {
      console.log('[SyncService] Connection restored — starting sync queue');
      runSyncQueue();
    }
  });

  console.log('[SyncService] Network listener started');
};

// Stops the listener — called on app unmount to prevent memory leaks.
export const stopSyncService = (): void => {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
    console.log('[SyncService] Network listener stopped');
  }
};

// Manually trigger a sync — used when a record is saved while online
export const triggerSync = (): void => {
  NetInfo.fetch().then((state) => {
    const isConnected = state.isConnected && state.isInternetReachable;
    if (isConnected) {
      runSyncQueue();
    }
  });
};