import { Image, View, StyleSheet } from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const evaluationIcon = require("../../assets/icons/sports/running.png");

export default function TrainingPreferencesExerciseEvaluationView({
  category = "Lifting confidence",
}) {
  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <IBMPlexText style={styles.titleText}>{category}</IBMPlexText>
        <IBMPlexText defaultWhite style={styles.kickerText}>Exercise Evaluation</IBMPlexText>
      </View>

      <View style={styles.descriptionWrap}>
        <Image
          source={evaluationIcon}
          style={styles.evaluationIcon}
          resizeMode="contain"
        />
        <IBMPlexText defaultWhite style={styles.descriptionText}>
          Answer how confidently and safely you can perform the following exercises
        </IBMPlexText>
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
    fontFamily: "IBMPlexSans_600SemiBold",
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
    alignItems: "center",
    gap: 18,
  },
  evaluationIcon: {
    width: 74,
    height: 74,
    tintColor: "#585858",
  },
  descriptionText: {
    color: "#9A9A9A",
    fontSize: 22,
    lineHeight: 27,
    textAlign: "center",
  },
});
