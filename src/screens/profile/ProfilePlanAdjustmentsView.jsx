import { View, Text, StyleSheet } from "react-native";

import ProfileFrequencySelector from "../../components/profileComponents/ProfileFrequencySelector.jsx";
import ProfileSportSelector from "../../components/profileComponents/ProfileSportSelector.jsx";
import ProfileTrainingPreferencesFields, {
  CombatTrainingIntensityMeter,
  ProfileDeloadStrategyOptions,
  ProfileLoadingStrategyOptions,
  ProfileSessionDurationSelector,
} from "../ProfileTrainingPreferencesFields.jsx";
import { SESSION_DURATION_OPTIONS } from "../../constants/trainingPreferences.js";

export default function ProfilePlanAdjustmentsView(props) {
  return (
    <>
      <View style={styles.heroHeader}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>Plan settings</Text>
          <Text style={styles.heroTitle}>Adjust Plan</Text>
          <Text style={styles.heroText}>
            Tune the inputs your next training block uses for sport, schedule,
            and progression logic.
          </Text>
        </View>
      </View>

      <View style={styles.inlineSection}>
        <Text style={styles.preferenceSummaryLabel}>Primary Sport</Text>
        <ProfileSportSelector
          options={props.combatSportOptions}
          value={props.primaryCombatSport}
          onChange={props.onPrimaryCombatSportChange}
          allowDeselect={false}
        />
        <ProfileTrainingPreferencesFields
          sections="plan"
          visiblePlanFields={["desiredTraining", "equipment", "trainingPhase"]}
          values={props.trainingPreferences}
          onChange={props.onTrainingPreferencesChange}
          allowDeselect={false}
        />
      </View>

      <View style={styles.inlineSection}>
        <Text style={styles.preferenceSummaryLabel}>Training Load</Text>
        <View style={styles.preferenceBox}>
          <View style={styles.preferenceControl}>
            <Text style={styles.preferenceControlLabel}>Training Frequency</Text>
            <ProfileFrequencySelector
              value={props.sessionsPerWeek}
              onChange={props.onSessionsPerWeekChange}
            />
          </View>

          <View style={styles.preferenceDivider} />

          <View style={styles.preferenceControl}>
            <Text style={styles.preferenceControlLabel}>Session Duration</Text>
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

          <View style={styles.preferenceDivider} />

          <View style={styles.preferenceControl}>
            <Text style={styles.preferenceControlLabel}>Combat Training Intensity</Text>
            <CombatTrainingIntensityMeter
              value={props.trainingPreferences?.combatTrainingIntensity}
              onChange={(value) =>
                props.onTrainingPreferencesChange?.({
                  ...(props.trainingPreferences || {}),
                  combatTrainingIntensity: value,
                })
              }
              onDragChange={props.onCombatIntensityDragChange}
            />
          </View>
        </View>
      </View>

      <View style={styles.inlineSection}>
        <Text style={styles.preferenceSummaryLabel}>Plan Structure</Text>
        <View style={[styles.preferenceBox, styles.structureBox]}>
          <View style={styles.structureControl}>
            <Text style={styles.preferenceControlLabel}>Loading Strategy</Text>
            <ProfileLoadingStrategyOptions
              compact
              value={props.trainingPreferences?.loadingStrategy}
              onChange={(value) =>
                props.onTrainingPreferencesChange?.({
                  ...(props.trainingPreferences || {}),
                  loadingStrategy: value,
                })
              }
            />
          </View>

          <View style={styles.preferenceDivider} />

          <View style={styles.structureControl}>
            <Text style={styles.preferenceControlLabel}>Deload Strategy</Text>
            <ProfileDeloadStrategyOptions
              compact
              value={props.trainingPreferences?.deloadStrategy}
              onChange={(value) =>
                props.onTrainingPreferencesChange?.({
                  ...(props.trainingPreferences || {}),
                  deloadStrategy: value,
                })
              }
            />
          </View>
        </View>
      </View>

      <View style={styles.inlineSection}>
        <ProfileTrainingPreferencesFields
          sections="plan"
          hiddenPlanFields={[
            "desiredTraining",
            "equipment",
            "trainingPhase",
            "combatTrainingIntensity",
            "loadingStrategy",
            "deloadStrategy",
          ]}
          values={props.trainingPreferences}
          onChange={props.onTrainingPreferencesChange}
          onCombatIntensityDragChange={props.onCombatIntensityDragChange}
          allowDeselect={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    marginVertical: 40,
  },
  heroCopy: {
    gap: 3,
    minWidth: 0,
  },
  heroEyebrow: {
    color: "#C9B259",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 29,
  },
  heroText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    maxWidth: 270,
  },
  inlineSection: {
    gap: 5,
  },
  preferenceBox: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#1E1E1E",
    gap: 12,
  },
  preferenceControl: {
    gap: 6,
  },
  structureBox: {
    gap: 8,
    paddingVertical: 10,
  },
  structureControl: {
    gap: 2,
  },
  preferenceControlLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E8E",
    textTransform: "uppercase",
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: "#1E1E1E",
  },
  preferenceSummaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
});
