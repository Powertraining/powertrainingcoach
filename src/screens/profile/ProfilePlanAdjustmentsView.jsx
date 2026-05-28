import { View, StyleSheet } from "react-native";

import ProfileFrequencySelector from "../../components/profileComponents/ProfileFrequencySelector.jsx";
import ProfileSportSelector from "../../components/profileComponents/ProfileSportSelector.jsx";
import FadeInFromBottomView from "../../components/navigation/FadeInFromBottomView.jsx";
import ProfileTrainingPreferencesFields, {
  CombatTrainingIntensityMeter,
  ProfileDeloadStrategyOptions,
  ProfileLoadingStrategyOptions,
  ProfileSessionDurationSelector,
} from "../ProfileTrainingPreferencesFields.jsx";
import { SESSION_DURATION_OPTIONS } from "../../constants/trainingPreferences.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
export default function ProfilePlanAdjustmentsView(props) {
  return (
    <>
      <FadeInFromBottomView delay={40} style={styles.heroHeader}>
        <View style={styles.heroCopy}>
          <IBMPlexText style={styles.heroEyebrow}>Plan settings</IBMPlexText>
          <IBMPlexText style={styles.heroTitle}>Adjust Plan</IBMPlexText>
          <IBMPlexText style={styles.heroText}>
            Tune the inputs your next training block uses for sport, schedule,
            and progression logic.
          </IBMPlexText>
        </View>
      </FadeInFromBottomView>

      <FadeInFromBottomView delay={90} style={styles.planFields}>
        <View style={styles.preferenceField}>
          <IBMPlexText style={styles.preferenceSummaryLabel}>Primary Sport</IBMPlexText>
          <ProfileSportSelector
            options={props.combatSportOptions}
            value={props.primaryCombatSport}
            onChange={props.onPrimaryCombatSportChange}
            allowDeselect={false}
          />
        </View>
        <ProfileTrainingPreferencesFields
          sections="plan"
          visiblePlanFields={[
            "desiredTraining",
            "equipment",
            "trainingPhase",
          ]}
          values={props.trainingPreferences}
          onChange={props.onTrainingPreferencesChange}
          allowDeselect={false}
        />
      </FadeInFromBottomView>

      <FadeInFromBottomView delay={140} style={styles.inlineSection}>
        <IBMPlexText style={styles.preferenceSummaryLabel}>Training Load</IBMPlexText>
        <View style={styles.preferenceBox}>
          <View style={styles.preferenceControl}>
            <IBMPlexText style={styles.preferenceControlLabel}>Training Frequency</IBMPlexText>
            <ProfileFrequencySelector
              value={props.sessionsPerWeek}
              onChange={props.onSessionsPerWeekChange}
            />
          </View>

          <View style={styles.preferenceDivider} />

          <View style={styles.preferenceControl}>
            <IBMPlexText style={styles.preferenceControlLabel}>Session Duration</IBMPlexText>
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
            <IBMPlexText style={styles.preferenceControlLabel}>Combat Training Intensity</IBMPlexText>
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
      </FadeInFromBottomView>

      <FadeInFromBottomView delay={190} style={styles.inlineSection}>
        <IBMPlexText style={styles.preferenceSummaryLabel}>Plan Structure</IBMPlexText>
        <View style={[styles.preferenceBox, styles.structureBox]}>
          <View style={styles.structureControl}>
            <IBMPlexText style={styles.preferenceControlLabel}>Loading Strategy</IBMPlexText>
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
            <IBMPlexText style={styles.preferenceControlLabel}>Deload Strategy</IBMPlexText>
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
      </FadeInFromBottomView>

      <FadeInFromBottomView delay={240} style={styles.inlineSection}>
        <ProfileTrainingPreferencesFields
          sections="plan"
          hiddenPlanFields={[
            "desiredTraining",
            "endurancePreferences",
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
      </FadeInFromBottomView>

      <FadeInFromBottomView delay={290} style={styles.inlineSection}>
        <IBMPlexText style={styles.preferenceSummaryLabel}>Endurance Training</IBMPlexText>
        <View style={styles.preferenceBox}>
          <ProfileTrainingPreferencesFields
            sections="plan"
            visiblePlanFields={["endurancePreferences"]}
            values={props.trainingPreferences}
            onChange={props.onTrainingPreferencesChange}
            allowDeselect={false}
            endurancePreferencesBare
            endurancePreferencesLabel=""
          />
        </View>
      </FadeInFromBottomView>
    </>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    marginTop: 28,
    marginBottom: 26,
  },
  heroCopy: {
    gap: 6,
    minWidth: 0,
  },
  heroEyebrow: {
    color: "#C9B259",
    fontSize: 11, fontWeight: "800",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28, fontWeight: "900",
    lineHeight: 33,
  },
  heroText: {
    color: "#9ca3af",
    fontSize: 13, fontWeight: "600",
    lineHeight: 18,
    maxWidth: 310,
  },
  inlineSection: {
    gap: 8,
    marginBottom: 18,
  },
  planFields: {
    gap: 18,
    marginBottom: 18,
  },
  preferenceField: {
    gap: 5,
  },
  preferenceBox: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#1E1E1E",
    gap: 14,
  },
  preferenceControl: {
    gap: 5,
  },
  structureBox: {
    gap: 12,
    paddingVertical: 14,
  },
  structureControl: {
    gap: 5,
  },
  preferenceControlLabel: {
    fontSize: 11, fontWeight: "700",
    color: "#8E8E8E",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: "#1E1E1E",
  },
  preferenceSummaryLabel: {
    fontSize: 12, fontWeight: "800",
    color: "#8E8E8E",
    lineHeight: 15,
    textTransform: "uppercase",
  },
});
