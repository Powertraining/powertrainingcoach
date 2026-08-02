import { StyleSheet, View } from "react-native";

import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";
import { MeasurementSystemSelector } from "../../components/profileComponents/MeasurementSystemCard.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function QuestionnaireMeasurementSystemView({
  value,
  onChange,
  onContinue,
  onBack,
  onClose,
}) {
  return (
    <QuestionnaireShell onClose={onClose}>
      <View style={styles.content}>
        <IBMPlexText titleBlock height={190}>
          Which measurement system do you use?
        </IBMPlexText>

        <View style={styles.selectionCard}>
          <IBMPlexText style={styles.cardTitle}>Choose your units</IBMPlexText>
          <IBMPlexText style={styles.cardText}>
            We’ll use this for loads, distances, speeds, and measurements throughout
            your program. You can change it later in Personal Details.
          </IBMPlexText>
          <MeasurementSystemSelector value={value} onChange={onChange} />
        </View>
      </View>

      <QuestionnaireBottomActionButton
        canContinue={Boolean(value)}
        hideWhenDisabled
        onBack={onBack}
        onContinue={onContinue}
      />
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: 110,
  },
  selectionCard: {
    alignSelf: "center",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
    gap: 10,
    padding: 18,
    width: "86%",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 21,
  },
  cardText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 4,
  },
});
