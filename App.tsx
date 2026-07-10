import React, { useEffect } from 'react';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Platform,
  AppState,
} from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { initDatabase, getAllRecords } from './src/db/database';
import { setRecords, updateRecordSyncStatus } from './src/store/triageSlice';
import { startSyncService, stopSyncService, registerSyncCallback,triggerSync } from './src/services/syncService';
import TriageForm from './src/components/TriageForm';
import SyncStatusBar from './src/components/SyncStatusBar';

function AppContent() {
  useEffect(() => {
    initDatabase();

// Temporary debug — remove before submission
const existing = getAllRecords();
console.log('[DB] All records on startup:', JSON.stringify(existing.map(r => ({
  id: r.id.slice(0, 8),
  patientName: r.patientName,
  syncStatus: r.syncStatus,
  syncedAt: r.syncedAt,
}))));
store.dispatch(setRecords(existing));

    registerSyncCallback((id, syncStatus, syncedAt) => {
      store.dispatch(updateRecordSyncStatus({ id, syncStatus, syncedAt }));
    });

    startSyncService();

    // Trigger sync when app comes back to foreground — handles the case
    // where the polling interval was paused by Android while offline.
    // When the paramedic turns airplane mode off and returns to the app,
    // this fires immediately rather than waiting for the next poll cycle.
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        console.log('[AppState] App foregrounded — triggering sync');
        triggerSync();
      }
    });

    return () => {
      stopSyncService();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerBadge}>🚑 EMKF</Text>
          <Text style={styles.headerTitle}>Paramedic Triage</Text>
        </View>
      </View>

      {/* Sync status banner — full width below header */}
      <SyncStatusBar />

      {/* Form */}
      <TriageForm />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    fontSize: 18,
    color: '#F1F5F9',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});