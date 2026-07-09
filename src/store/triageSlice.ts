import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TriageRecord, SyncStatus } from '../types/triage';

interface TriageState {
  records: TriageRecord[];
  isSyncing: boolean;
  pendingCount: number;
}

const initialState: TriageState = {
  records: [],
  isSyncing: false,
  pendingCount: 0,
};

const triageSlice = createSlice({
  name: 'triage',
  initialState,
  reducers: {
    setRecords: (state, action: PayloadAction<TriageRecord[]>) => {
      state.records = action.payload;
      state.pendingCount = action.payload.filter(
        (r) => r.syncStatus === 'pending' || r.syncStatus === 'failed'
      ).length;
    },
    addRecord: (state, action: PayloadAction<TriageRecord>) => {
      state.records.unshift(action.payload);
      if (
        action.payload.syncStatus === 'pending' ||
        action.payload.syncStatus === 'failed'
      ) {
        state.pendingCount += 1;
      }
    },
    updateRecordSyncStatus: (
    state,
    action: PayloadAction<{
        id: string;
        syncStatus: SyncStatus;
        syncedAt?: string;
    }>
    ) => {
    const record = state.records.find((r) => r.id === action.payload.id);
    if (record) {
        record.syncStatus = action.payload.syncStatus;
        if (action.payload.syncedAt) {
        record.syncedAt = action.payload.syncedAt;
        }
    }
    // Recalculate pendingCount from scratch after every status change
    // rather than incrementing/decrementing — avoids drift bugs
    state.pendingCount = state.records.filter(
        (r) => r.syncStatus === 'pending' || r.syncStatus === 'failed'
    ).length;
    },
    setIsSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
  },
});

export const { setRecords, addRecord, updateRecordSyncStatus, setIsSyncing } =
  triageSlice.actions;

export default triageSlice.reducer;