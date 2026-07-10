// Simulates POST /api/v1/triage per the assessment spec
import { TriageRecord } from '../types/triage';

// Simulates a real backend API per the spec's requirement —
// introduces a 2-second delay and a random failure toggle to
// prove the sync queue handles retries correctly.

const SIMULATED_DELAY_MS = 2000;
const FAILURE_RATE = 0.2; // 20% chance of simulated network failure

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: TriageRecord;
}

export const postTriageRecord = async (
  record: TriageRecord
): Promise<ApiResponse> => {
  await delay(SIMULATED_DELAY_MS);

  // Simulate random network failures to prove sync queue retries
  if (Math.random() < FAILURE_RATE) {
    throw new Error('Simulated network failure — sync queue will retry');
  }

  // Simulate successful server response
  return {
    success: true,
    message: 'Triage record synced successfully',
    data: {
      ...record,
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
    },
  };
};