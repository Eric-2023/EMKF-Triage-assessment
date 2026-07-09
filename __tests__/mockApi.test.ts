import { postTriageRecord } from '../src/services/mockApi';
import { TriageRecord } from '../src/types/triage';

const mockRecord: TriageRecord = {
  id: 'test-id-001',
  patientName: 'Jane Wanjiku',
  conditionDescription: 'Severe head trauma from road accident',
  priorityLevel: 1,
  status: 'In-Transit',
  syncStatus: 'pending',
  createdAt: new Date().toISOString(),
};

describe('mockApi', () => {
  describe('postTriageRecord', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it('resolves successfully after simulated delay', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const promise = postTriageRecord(mockRecord);
      jest.runAllTimers();
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.message).toBe('Triage record synced successfully');
      expect(result.data?.syncStatus).toBe('synced');
      expect(result.data?.syncedAt).toBeDefined();
    });

    it('throws an error on simulated network failure', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      const promise = postTriageRecord(mockRecord);
      jest.runAllTimers();
      await expect(promise).rejects.toThrow(
        'Simulated network failure — sync queue will retry'
      );
    });

    it('returns the original record data with synced status on success', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const promise = postTriageRecord(mockRecord);
      jest.runAllTimers();
      const result = await promise;
      expect(result.data?.patientName).toBe('Jane Wanjiku');
      expect(result.data?.priorityLevel).toBe(1);
    });

    it('succeeds when random value is above failure rate threshold', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const promise = postTriageRecord(mockRecord);
      jest.runAllTimers();
      const result = await promise;
      expect(result.success).toBe(true);
    });

    it('fails when random value is below failure rate threshold', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.19);
      const promise = postTriageRecord(mockRecord);
      jest.runAllTimers();
      await expect(promise).rejects.toThrow();
    });
  });
});