export type PriorityLevel = 1 | 2 | 3 | 4 | 5;

export type TriageStatus = 'Pending' | 'In-Transit';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

export interface TriageRecord {
  id: string;
  patientName: string;
  conditionDescription: string;
  priorityLevel: PriorityLevel;
  status: TriageStatus;
  syncStatus: SyncStatus;
  createdAt: string;
  syncedAt?: string;
}

export interface TriageFormData {
  patientName: string;
  conditionDescription: string;
  priorityLevel: PriorityLevel | null;
  status: TriageStatus;
}

// Priority color mapping — critical cases (1 & 2) use high-visibility
// hazard colors per the spec's UI requirement
export const PRIORITY_COLORS: Record<PriorityLevel, { bg: string; text: string; label: string }> = {
  1: { bg: '#B91C1C', text: '#FFFFFF', label: 'P1 — CRITICAL' },
  2: { bg: '#EA580C', text: '#FFFFFF', label: 'P2 — EMERGENT' },
  3: { bg: '#D97706', text: '#FFFFFF', label: 'P3 — URGENT' },
  4: { bg: '#16A34A', text: '#FFFFFF', label: 'P4 — LESS URGENT' },
  5: { bg: '#2563EB', text: '#FFFFFF', label: 'P5 — NON-URGENT' },
};