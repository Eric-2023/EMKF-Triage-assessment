import { configureStore } from '@reduxjs/toolkit';
import triageReducer, {
  addRecord,
  setRecords,
  updateRecordSyncStatus,
  setIsSyncing,
} from '../src/store/triageSlice';
import { TriageRecord } from '../src/types/triage';

// Helper to create a test store
const makeStore = () =>
  configureStore({ reducer: { triage: triageReducer } });

// Helper to create a mock triage record
const mockRecord = (overrides?: Partial<TriageRecord>): TriageRecord => ({
  id: 'test-id-001',
  patientName: 'John Doe',
  conditionDescription: 'Severe chest pain',
  priorityLevel: 1,
  status: 'Pending',
  syncStatus: 'pending',
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('triageSlice', () => {
  describe('addRecord', () => {
    it('adds a record to the store', () => {
      const store = makeStore();
      const record = mockRecord();
      store.dispatch(addRecord(record));

      const { records } = store.getState().triage;
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('test-id-001');
    });

    it('increments pendingCount when record is pending', () => {
      const store = makeStore();
      store.dispatch(addRecord(mockRecord({ syncStatus: 'pending' })));
      expect(store.getState().triage.pendingCount).toBe(1);
    });

    it('does not increment pendingCount when record is synced', () => {
      const store = makeStore();
      store.dispatch(addRecord(mockRecord({ syncStatus: 'synced' })));
      expect(store.getState().triage.pendingCount).toBe(0);
    });

    it('adds new records to the top of the list', () => {
      const store = makeStore();
      store.dispatch(addRecord(mockRecord({ id: 'first' })));
      store.dispatch(addRecord(mockRecord({ id: 'second' })));

      const { records } = store.getState().triage;
      expect(records[0].id).toBe('second');
      expect(records[1].id).toBe('first');
    });
  });

  describe('setRecords', () => {
    it('replaces all records', () => {
      const store = makeStore();
      store.dispatch(addRecord(mockRecord({ id: 'old' })));
      store.dispatch(setRecords([mockRecord({ id: 'new' })]));

      const { records } = store.getState().triage;
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('new');
    });

    it('correctly calculates pendingCount from loaded records', () => {
      const store = makeStore();
      store.dispatch(
        setRecords([
          mockRecord({ id: '1', syncStatus: 'pending' }),
          mockRecord({ id: '2', syncStatus: 'synced' }),
          mockRecord({ id: '3', syncStatus: 'failed' }),
        ])
      );
      expect(store.getState().triage.pendingCount).toBe(2);
    });
  });

  describe('updateRecordSyncStatus', () => {
    it('updates syncStatus of a specific record', () => {
      const store = makeStore();
      store.dispatch(addRecord(mockRecord({ id: 'abc', syncStatus: 'pending' })));
      store.dispatch(
        updateRecordSyncStatus({ id: 'abc', syncStatus: 'synced' })
      );

      const record = store.getState().triage.records.find((r) => r.id === 'abc');
      expect(record?.syncStatus).toBe('synced');
    });

    it('decrements pendingCount when record moves to synced', () => {
      const store = makeStore();
      store.dispatch(addRecord(mockRecord({ id: 'abc', syncStatus: 'pending' })));
      expect(store.getState().triage.pendingCount).toBe(1);

      store.dispatch(
        updateRecordSyncStatus({ id: 'abc', syncStatus: 'synced' })
      );
      expect(store.getState().triage.pendingCount).toBe(0);
    });

    it('sets syncedAt when provided', () => {
      const store = makeStore();
      const syncedAt = new Date().toISOString();
      store.dispatch(addRecord(mockRecord({ id: 'abc' })));
      store.dispatch(
        updateRecordSyncStatus({ id: 'abc', syncStatus: 'synced', syncedAt })
      );

      const record = store.getState().triage.records.find((r) => r.id === 'abc');
      expect(record?.syncedAt).toBe(syncedAt);
    });

    it('does not affect other records', () => {
      const store = makeStore();
      store.dispatch(addRecord(mockRecord({ id: '1', syncStatus: 'pending' })));
      store.dispatch(addRecord(mockRecord({ id: '2', syncStatus: 'pending' })));
      store.dispatch(
        updateRecordSyncStatus({ id: '1', syncStatus: 'synced' })
      );

      const record2 = store.getState().triage.records.find((r) => r.id === '2');
      expect(record2?.syncStatus).toBe('pending');
      expect(store.getState().triage.pendingCount).toBe(1);
    });
  });

  describe('setIsSyncing', () => {
    it('sets isSyncing flag', () => {
      const store = makeStore();
      store.dispatch(setIsSyncing(true));
      expect(store.getState().triage.isSyncing).toBe(true);

      store.dispatch(setIsSyncing(false));
      expect(store.getState().triage.isSyncing).toBe(false);
    });
  });
});