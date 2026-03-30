import { View, StyleSheet } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function ForumView() {
  return (
    <QuestionnaireShell>
      <View style={styles.container} />
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
