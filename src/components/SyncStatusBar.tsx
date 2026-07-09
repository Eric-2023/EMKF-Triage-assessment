import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function SyncStatusBar() {
  const { pendingCount, isSyncing } = useSelector(
    (state: RootState) => state.triage
  );

  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <View
      style={[
        styles.container,
        isSyncing ? styles.syncing : styles.pending,
      ]}
    >
      {isSyncing ? (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.text}>Syncing records to server...</Text>
        </>
      ) : (
        <>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.text}>
            {pendingCount} record{pendingCount > 1 ? 's' : ''} pending sync
            — will upload when connected
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pending: {
    backgroundColor: '#92400E',
  },
  syncing: {
    backgroundColor: '#1D4ED8',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  icon: {
    fontSize: 14,
  },
});