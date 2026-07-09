import React, { useEffect } from 'react';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { initDatabase, getAllRecords } from './src/db/database';
import { setRecords, updateRecordSyncStatus } from './src/store/triageSlice';
import { startSyncService, stopSyncService, registerSyncCallback } from './src/services/syncService';
import TriageForm from './src/components/TriageForm';
import SyncStatusBar from './src/components/SyncStatusBar';

function AppContent() {
  useEffect(() => {
    initDatabase();

    const existing = getAllRecords();
    store.dispatch(setRecords(existing));

    // Register callback so sync service can update Redux store
    registerSyncCallback((id, syncStatus, syncedAt) => {
      store.dispatch(updateRecordSyncStatus({ id, syncStatus, syncedAt }));
    });

    startSyncService();

    return () => {
      stopSyncService();
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
        <SyncStatusBar />
      </View>

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});