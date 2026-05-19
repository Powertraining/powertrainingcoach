import { Text, View, StyleSheet } from "react-native";
import StandardText from "../../components/textComponents/StandardText";

export default function TrainingPreferencesExerciseEvaluationView({
  category = "Strength Training",
}) {
  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <Text style={styles.titleText}>{category}</Text>
        <StandardText style={styles.kickerText}>Exercise Evaluation</StandardText>
      </View>

      <View style={styles.descriptionWrap}>
        <StandardText style={styles.descriptionText}>
          Answer how confidently and safely you can perform the following exercises
        </StandardText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 18,
  },
  titleWrap: {
    width: 225,
    height: 230,
    justifyContent: "flex-start",
    paddingTop: 35,
    alignItems: "center",
  },
  titleText: {
    color: "#ffffff",
    fontFamily: "BebasNeue",
    fontSize: 35,
    lineHeight: 39,
    textAlign: "center",
  },
  kickerText: {
    color: "#C9B259",
    fontSize: 16,
    lineHeight: 19,
    marginTop: 8,
  },
  descriptionWrap: {
    width: "75%",
    minHeight: 120,
    justifyContent: "center",
  },
  descriptionText: {
    color: "#9A9A9A",
    fontSize: 22,
    lineHeight: 27,
    textAlign: "center",
  },
});
