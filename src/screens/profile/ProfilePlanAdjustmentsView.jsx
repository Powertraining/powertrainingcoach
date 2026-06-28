import { useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

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
import WhiteBottomMenu from "../../components/profileComponents/WhiteBottomMenu.jsx";

const MONTHLY_REGENERATION_LIMIT = 3;

export default function ProfilePlanAdjustmentsView(props) {
  const [regenerateConfirmVisible, setRegenerateConfirmVisible] = useState(false);
  const [regenerationFeedback, setRegenerationFeedback] = useState("");
  const [regenerationStep, setRegenerationStep] = useState("feedback");
  const scopeSlideX = useRef(new Animated.Value(-44)).current;
  const scopeOpacity = useRef(new Animated.Value(0)).current;
  const regenerationsRemaining = Math.max(
    0,
    Math.min(
      MONTHLY_REGENERATION_LIMIT,
      Number(props.planRegenerationsRemaining) || 0
    )
  );

  function showScopeQuestionACB() {
    Keyboard.dismiss();
    setRegenerationStep("scope");
    scopeSlideX.setValue(-44);
    scopeOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(scopeSlideX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(scopeOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function confirmRegenerationACB(scope) {
    const succeeded = await props.onRegeneratePlan?.(
      regenerationFeedback,
      scope
    );
    if (succeeded) {
      setRegenerationFeedback("");
      setRegenerationStep("feedback");
      setRegenerateConfirmVisible(false);
    }
  }

  function closeRegenerationConfirmACB() {
    if (!props.isSubmitting) {
      setRegenerationFeedback("");
      setRegenerationStep("feedback");
      setRegenerateConfirmVisible(false);
    }
  }

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
            <IBMPlexText style={styles.preferenceControlLabel}>Loading Scheme</IBMPlexText>
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

      {props.canRegeneratePlan ? (
        <FadeInFromBottomView delay={340} style={styles.regenerateFooter}>
          <TouchableOpacity
            disabled={props.isSubmitting || !props.hasProgram}
            onPress={() => setRegenerateConfirmVisible(true)}
            style={[
              styles.regenerateLink,
              props.isSubmitting || !props.hasProgram
                ? styles.regenerateLinkDisabled
                : null,
            ]}
          >
            <IBMPlexText style={styles.regenerateLinkText}>
              Regenerate plan ({regenerationsRemaining}/{MONTHLY_REGENERATION_LIMIT}) &gt;
            </IBMPlexText>
          </TouchableOpacity>
        </FadeInFromBottomView>
      ) : null}

      <WhiteBottomMenu
        avoidKeyboard
        visible={regenerateConfirmVisible}
        onDismiss={closeRegenerationConfirmACB}
        title={
          regenerationStep === "feedback"
            ? "Regenerate your plan?"
            : "Regenerate from where?"
        }
        description={
          regenerationsRemaining > 0 && regenerationStep === "feedback"
            ? `You have ${regenerationsRemaining} of ${MONTHLY_REGENERATION_LIMIT} plan regenerations left this month. Tell us what you did not like before continuing.`
            : regenerationsRemaining > 0
            ? ""
            : "You have used all plan regenerations for this month. Your allowance resets next month."
        }
        content={
          regenerationsRemaining > 0 && regenerationStep === "feedback" ? (
            <View style={styles.feedbackField}>
              <IBMPlexText style={styles.feedbackLabel}>
                What should change?
              </IBMPlexText>
              <TextInput
                editable={!props.isSubmitting}
                maxLength={2000}
                multiline
                onChangeText={setRegenerationFeedback}
                placeholder="Tell us what you did not like about your current plan..."
                placeholderTextColor="#8A8A8A"
                selectionColor="#141414"
                style={styles.feedbackInput}
                textAlignVertical="top"
                value={regenerationFeedback}
              />
              <IBMPlexText style={styles.feedbackHint}>
                Required to regenerate your plan.
              </IBMPlexText>
            </View>
          ) : regenerationsRemaining > 0 ? (
            <Animated.View
              style={[
                styles.scopeQuestion,
                {
                  opacity: scopeOpacity,
                  transform: [{ translateX: scopeSlideX }],
                },
              ]}
            >
              <View style={styles.scopeOption}>
                <IBMPlexText style={styles.scopeText}>
                  Creates a completely new active plan and resets all completion
                  progress.
                </IBMPlexText>
                <TouchableOpacity
                  disabled={props.isSubmitting}
                  onPress={() => confirmRegenerationACB("from_start")}
                  style={styles.scopeButton}
                >
                  <IBMPlexText style={styles.scopeButtonText}>
                    {props.isSubmitting ? "Regenerating..." : "Regenerate from start"}
                  </IBMPlexText>
                </TouchableOpacity>
              </View>
              <View style={styles.scopeOption}>
                <IBMPlexText style={styles.scopeText}>
                  Keeps completed sessions and regenerates only the unfinished
                  training ahead.
                </IBMPlexText>
                <TouchableOpacity
                  disabled={props.isSubmitting}
                  onPress={() => confirmRegenerationACB("from_now")}
                  style={styles.scopeButton}
                >
                  <IBMPlexText style={styles.scopeButtonText}>
                    {props.isSubmitting ? "Regenerating..." : "Regenerate from now on"}
                  </IBMPlexText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : null
        }
        buttonText={
          regenerationStep === "feedback"
            ? "Regenerate plan"
            : ""
        }
        buttonDisabled={
          props.isSubmitting ||
          regenerationsRemaining < 1 ||
          regenerationFeedback.trim().length === 0
        }
        onButtonPress={showScopeQuestionACB}
        secondaryButtonText="Cancel"
        secondaryButtonDisabled={props.isSubmitting}
        onSecondaryButtonPress={closeRegenerationConfirmACB}
      />
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
  regenerateFooter: {
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 18,
    marginTop: 8,
  },
  regenerateLink: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  regenerateLinkDisabled: {
    opacity: 0.42,
  },
  regenerateLinkText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
  },
  feedbackField: {
    gap: 7,
  },
  feedbackLabel: {
    color: "#141414",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  feedbackInput: {
    minHeight: 108,
    borderColor: "#D4D4D4",
    borderRadius: 14,
    borderWidth: 1,
    color: "#141414",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  feedbackHint: {
    color: "#737373",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  scopeQuestion: {
    gap: 16,
  },
  scopeOption: {
    gap: 8,
  },
  scopeText: {
    color: "#5F5F5F",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  scopeButton: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  scopeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
  },
});
