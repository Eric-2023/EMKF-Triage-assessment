import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { PriorityLevel, PRIORITY_COLORS } from '../types/triage';

interface Props {
  selected: PriorityLevel | null;
  onSelect: (level: PriorityLevel) => void;
  error?: string;
}

const LEVELS: PriorityLevel[] = [1, 2, 3, 4, 5];

export default function PrioritySelector({ selected, onSelect, error }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Priority Level</Text>
      <View style={styles.grid}>
        {LEVELS.map((level) => {
          const colors = PRIORITY_COLORS[level];
          const isSelected = selected === level;
          return (
            <TouchableOpacity
              key={level}
              activeOpacity={0.8}
              onPress={() => onSelect(level)}
              style={[
                styles.button,
                { backgroundColor: isSelected ? colors.bg : '#1E293B' },
                isSelected && styles.buttonSelected,
              ]}
              accessibilityLabel={colors.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.buttonNumber,
                  { color: isSelected ? colors.text : '#94A3B8' },
                ]}
              >
                {level}
              </Text>
              <Text
                style={[
                  styles.buttonLabel,
                  { color: isSelected ? colors.text : '#64748B' },
                ]}
                numberOfLines={2}
              >
                {colors.label.split('—')[1]?.trim()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {selected && (
        <View
          style={[
            styles.selectedBanner,
            { backgroundColor: PRIORITY_COLORS[selected].bg },
          ]}
        >
          <Text style={styles.selectedBannerText}>
            {PRIORITY_COLORS[selected].label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonSelected: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  buttonLabel: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  selectedBanner: {
    marginTop: 10,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  selectedBannerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  error: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 6,
  },
});