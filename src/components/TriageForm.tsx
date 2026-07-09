import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import * as Crypto from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';
import { TriageFormData, TriageRecord, PriorityLevel, TriageStatus } from '../types/triage';
import { saveTriageRecord } from '../db/database';
import { addRecord } from '../store/triageSlice';
import { triggerSync } from '../services/syncService';
import PrioritySelector from './PrioritySelector';

const initialForm: TriageFormData = {
  patientName: '',
  conditionDescription: '',
  priorityLevel: null,
  status: 'Pending',
};

interface FormErrors {
  patientName?: string;
  conditionDescription?: string;
  priorityLevel?: string;
}

export default function TriageForm() {
  const dispatch = useDispatch();
  const [form, setForm] = useState<TriageFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.patientName.trim())
      newErrors.patientName = 'Patient name is required';
    if (!form.conditionDescription.trim())
      newErrors.conditionDescription = 'Condition description is required';
    if (!form.priorityLevel)
      newErrors.priorityLevel = 'Priority level must be selected';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      const record: TriageRecord = {
        id: Crypto.randomUUID(),
        patientName: form.patientName.trim(),
        conditionDescription: form.conditionDescription.trim(),
        priorityLevel: form.priorityLevel as PriorityLevel,
        status: form.status as TriageStatus,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Always save locally first — guarantees no data loss
      saveTriageRecord(record);
      dispatch(addRecord(record));

      if (isOnline) {
        setSuccessMessage('Record saved — syncing to server...');
        triggerSync();
      } else {
        setSuccessMessage(
          'Offline — record saved locally. Will sync automatically when connected.'
        );
      }

      setForm(initialForm);
      setErrors({});
    } catch (error) {
      setSuccessMessage('Error saving record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const STATUS_OPTIONS: TriageStatus[] = ['Pending', 'In-Transit'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>NEW TRIAGE RECORD</Text>
        <Text style={styles.subheading}>
          Complete all fields before submitting
        </Text>

        {/* Patient Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Patient Name</Text>
          <TextInput
            style={[styles.input, errors.patientName && styles.inputError]}
            placeholder="Enter patient name"
            placeholderTextColor="#475569"
            value={form.patientName}
            onChangeText={(v) => {
              setForm((f) => ({ ...f, patientName: v }));
              if (errors.patientName)
                setErrors((e) => ({ ...e, patientName: undefined }));
            }}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {errors.patientName && (
            <Text style={styles.errorText}>{errors.patientName}</Text>
          )}
        </View>

        {/* Condition Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Condition Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.conditionDescription && styles.inputError,
            ]}
            placeholder="Describe the patient's condition"
            placeholderTextColor="#475569"
            value={form.conditionDescription}
            onChangeText={(v) => {
              setForm((f) => ({ ...f, conditionDescription: v }));
              if (errors.conditionDescription)
                setErrors((e) => ({ ...e, conditionDescription: undefined }));
            }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          {errors.conditionDescription && (
            <Text style={styles.errorText}>{errors.conditionDescription}</Text>
          )}
        </View>

        {/* Priority Selector */}
        <PrioritySelector
          selected={form.priorityLevel}
          onSelect={(level) => {
            setForm((f) => ({ ...f, priorityLevel: level }));
            if (errors.priorityLevel)
              setErrors((e) => ({ ...e, priorityLevel: undefined }));
          }}
          error={errors.priorityLevel}
        />

        {/* Status */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                activeOpacity={0.8}
                onPress={() => setForm((f) => ({ ...f, status: s }))}
                style={[
                  styles.statusButton,
                  form.status === s && styles.statusButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    form.status === s && styles.statusButtonTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Success / info message */}
        {successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>SUBMIT TRIAGE RECORD</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subheading: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#F1F5F9',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 5,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusButtonActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  statusButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  successBanner: {
    backgroundColor: '#064E3B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  successText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});