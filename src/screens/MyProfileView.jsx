import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

import TrainingPreferencesFields from "./TrainingPreferencesFields.jsx";

export function MyProfileView(props) {
  const preferredWeekdaySummary = Array.isArray(props.trainingPreferences?.preferredWeekdays)
    ? props.trainingPreferences.preferredWeekdays
        .map((weekday, index) => (weekday ? `Day ${index + 1} - ${weekday}` : ""))
        .filter(Boolean)
        .join(" • ")
    : "";

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.pageTitle}>My Profile</Text>
        <Text style={styles.pageDescription}>
          Update your account details and the app logic used for future training plans.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={props.username}
            placeholder={props.usernamePlaceholder}
            onChangeText={props.onUsernameChange}
            editable={!props.isSubmitting}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            value={props.email}
            placeholder={props.emailPlaceholder}
            editable={false}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, styles.inputDisabled]}
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
              style={styles.input}
            />
          </View>
        )}

        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionLabel}>Subscription</Text>
          <Text style={styles.subscriptionValue}>{props.subscriptionText}</Text>
        </View>

        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionLabel}>Primary Sport</Text>
          <Text style={styles.subscriptionValue}>
            {props.primaryCombatSport || "Not selected"}
          </Text>
          <TouchableOpacity
            onPress={props.onEditPrimaryCombatSport}
            disabled={props.isSubmitting}
            style={styles.inlineActionButton}
          >
            <Text style={styles.inlineActionButtonText}>Edit primary sport</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionLabel}>Training Frequency</Text>
          <Text style={styles.subscriptionValue}>
            {props.sessionsPerWeek ? `${props.sessionsPerWeek} sessions per week` : "Not selected"}
          </Text>
          {preferredWeekdaySummary ? (
            <Text style={styles.preferenceText}>{preferredWeekdaySummary}</Text>
          ) : null}
          <TouchableOpacity
            onPress={props.onEditTrainingFrequency}
            disabled={props.isSubmitting}
            style={styles.inlineActionButton}
          >
            <Text style={styles.inlineActionButtonText}>Edit training frequency</Text>
          </TouchableOpacity>
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
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
  },
  pageDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.14)",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputDisabled: {
    color: "#64748b",
  },
  subscriptionCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
    gap: 4,
  },
  subscriptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  subscriptionValue: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0f172a",
  },
  preferenceText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
  },
  inlineActionButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.12)",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  inlineActionButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
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
