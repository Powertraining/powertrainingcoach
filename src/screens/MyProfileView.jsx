import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProfileFrequencySelector from "../components/profileComponents/ProfileFrequencySelector.jsx";
import ProfileSportSelector from "../components/profileComponents/ProfileSportSelector.jsx";
import SubscriptionCard from "../components/profileComponents/SubscriptionCard.jsx";
import ProfileTrainingPreferencesFields, {
  ProfileSessionDurationSelector,
} from "./ProfileTrainingPreferencesFields.jsx";
import { SESSION_DURATION_OPTIONS } from "../constants/trainingPreferences.js";

export function MyProfileView(props) {
  const insets = useSafeAreaInsets();
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  return (
    <ScrollView
      scrollEnabled={!isScrollLocked}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 12, 20),
          paddingBottom: Math.max(insets.bottom + 96, 120),
        },
      ]}
    >
      <SubscriptionCard
        planName={props.subscriptionPlanName}
        timeRemainingText={props.subscriptionTimeRemainingText}
        subscriptionText={props.subscriptionText}
        isActive={props.isSubscriptionActive}
        isSubmitting={props.isSubmitting}
        onPress={props.onChangeSubscription}
      />

      <View style={styles.inlineSection}>
        <Text style={styles.preferenceSummaryLabel}>Personal Details</Text>
        <View style={styles.accountCard}>
          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              value={props.email}
              placeholder={props.emailPlaceholder}
              editable={false}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#8E8E8E"
              style={[styles.input, styles.inputDisabled]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={props.username}
              placeholder={props.usernamePlaceholder}
              placeholderTextColor="#8E8E8E"
              onChangeText={props.onUsernameChange}
              editable={!props.isSubmitting}
              style={styles.input}
            />
          </View>

          {!props.hidePassword && (
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={props.password}
                onChangeText={props.onPasswordChange}
                editable={!props.isSubmitting}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#8E8E8E"
                style={styles.input}
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.inlineSection}>
        <Text style={styles.preferenceSummaryLabel}>Primary Sport</Text>
        <ProfileSportSelector
          options={props.combatSportOptions}
          value={props.primaryCombatSport}
          onChange={props.onPrimaryCombatSportChange}
        />
      </View>

      <View style={styles.inlineSection}>
        <Text style={styles.preferenceSummaryLabel}>Training Frequency</Text>
        <View style={styles.frequencyBox}>
          <ProfileFrequencySelector
            value={props.sessionsPerWeek}
            onChange={props.onSessionsPerWeekChange}
          />
        </View>
      </View>

      <View style={styles.inlineSection}>
        <Text style={styles.preferenceSummaryLabel}>Session Duration</Text>
        <ProfileSessionDurationSelector
          options={SESSION_DURATION_OPTIONS}
          value={props.trainingPreferences?.sessionDuration}
          onChange={(value) =>
            props.onTrainingPreferencesChange?.({
              ...(props.trainingPreferences || {}),
              sessionDuration: value,
            })
          }
        />
      </View>

      <View style={styles.inlineSection}>
        <ProfileTrainingPreferencesFields
          values={props.trainingPreferences}
          onChange={props.onTrainingPreferencesChange}
          onCombatIntensityDragChange={setIsScrollLocked}
        />
      </View>

      {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={props.onSave}
          disabled={props.isSubmitting || !props.canSave}
          style={[
            styles.primaryButton,
            props.isSubmitting || !props.canSave ? styles.buttonDisabled : null,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {props.isSubmitting ? "Saving..." : "Save changes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={props.onCancel}
          disabled={props.isSubmitting}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={props.onLogout}
          disabled={props.isSubmitting}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  accountCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#1E1E1E",
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E1E1E",
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#ffffff",
  },
  inputDisabled: {
    color: "#8E8E8E",
  },
  inlineSection: {
    gap: 5,
  },
  frequencyBox: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#1E1E1E",
    gap: 6,
  },
  preferenceSummaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    gap: 12,
    paddingBottom: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.18)",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#991b1b",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
