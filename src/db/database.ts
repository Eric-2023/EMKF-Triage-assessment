import * as SQLite from 'expo-sqlite';
import { TriageRecord } from '../types/triage';

const db = SQLite.openDatabaseSync('triage.db');

export const initDatabase = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS triage_records (
      id TEXT PRIMARY KEY NOT NULL,
      patientName TEXT NOT NULL,
      conditionDescription TEXT NOT NULL,
      priorityLevel INTEGER NOT NULL,
      status TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      syncedAt TEXT
    );
  `);
};

export const saveTriageRecord = (record: TriageRecord): void => {
  db.runSync(
    `INSERT INTO triage_records 
      (id, patientName, conditionDescription, priorityLevel, status, syncStatus, createdAt, syncedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.patientName,
      record.conditionDescription,
      record.priorityLevel,
      record.status,
      record.syncStatus,
      record.createdAt,
      record.syncedAt ?? null,
    ]
  );
};

export const getPendingRecords = (): TriageRecord[] => {
  return db.getAllSync<TriageRecord>(
    `SELECT * FROM triage_records WHERE syncStatus = 'pending' OR syncStatus = 'failed' ORDER BY createdAt ASC`
  );
};

export const updateSyncStatus = (
  id: string,
  syncStatus: 'synced' | 'syncing' | 'failed',
  syncedAt?: string
): void => {
  db.runSync(
    `UPDATE triage_records SET syncStatus = ?, syncedAt = ? WHERE id = ?`,
    [syncStatus, syncedAt ?? null, id]
  );
};

export const getAllRecords = (): TriageRecord[] => {
  return db.getAllSync<TriageRecord>(
    `SELECT * FROM triage_records ORDER BY createdAt DESC`
  );
};