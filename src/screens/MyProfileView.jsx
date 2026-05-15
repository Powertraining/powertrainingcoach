import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProfileFrequencySelector from "../components/profileComponents/ProfileFrequencySelector.jsx";
import ProfileSportSelector from "../components/profileComponents/ProfileSportSelector.jsx";
import SubscriptionCard from "../components/profileComponents/SubscriptionCard.jsx";
import TrainingPreferencesFields from "./TrainingPreferencesFields.jsx";

export function MyProfileView(props) {
  const insets = useSafeAreaInsets();
  const preferredWeekdaySummary = Array.isArray(props.trainingPreferences?.preferredWeekdays)
    ? props.trainingPreferences.preferredWeekdays
        .map((weekday, index) => (weekday ? `Day ${index + 1} - ${weekday}` : ""))
        .filter(Boolean)
        .join(" • ")
    : "";

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top + 12, 20) },
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
          {preferredWeekdaySummary ? (
            <Text style={styles.preferenceText} numberOfLines={2}>
              {preferredWeekdaySummary}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <TrainingPreferencesFields
          title="Training Preferences"
          description="These values are saved to your profile and used when the app builds or regenerates training plans."
          values={props.trainingPreferences}
          onChange={props.onTrainingPreferencesChange}
          appLogicTitle="App Logic Settings"
          appLogicDescription="Adjust the strength-planning logic and the full onboarding preferences from your profile."
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
  card: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    gap: 14,
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
  preferenceSummaryCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    gap: 5,
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
  preferenceText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#8E8E8E",
    marginTop: 2,
  },
  inlineActionButton: {
    marginTop: 7,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.12)",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  inlineActionButtonText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
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
