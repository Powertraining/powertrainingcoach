import { View, Text, StyleSheet } from "react-native";

import ProfileFrequencySelector from "../../components/profileComponents/ProfileFrequencySelector.jsx";
import ProfileSportSelector from "../../components/profileComponents/ProfileSportSelector.jsx";
import ProfileTrainingPreferencesFields, {
  ProfileSessionDurationSelector,
} from "../ProfileTrainingPreferencesFields.jsx";
import { SESSION_DURATION_OPTIONS } from "../../constants/trainingPreferences.js";

export default function ProfilePlanAdjustmentsView(props) {
  return (
    <>
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
          sections="plan"
          values={props.trainingPreferences}
          onChange={props.onTrainingPreferencesChange}
          onCombatIntensityDragChange={props.onCombatIntensityDragChange}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
});
