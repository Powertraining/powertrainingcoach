import { View, StyleSheet, useWindowDimensions } from "react-native";
import TitleText from "../../components/textComponents/TitleText";
import StandardText from "../../components/textComponents/StandardText";

export default function TrainingPreferencesExerciseEvaluationView() {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <TitleText height={86}>Exercise Evaluation</TitleText>
      <StandardText style={styles.categoryText}>Strength Training</StandardText>
      <StandardText style={styles.descriptionText}>
        Answer how confidently and safely you can perform the following exercises
      </StandardText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 120,
  },
  categoryText: {
    color: "#C9B259",
    fontSize: 14,
    marginTop: 6,
  },
  descriptionText: {
    width: "75%",
    fontSize: 22,
    marginTop: 150,
    textAlign: "center",
  },
});
