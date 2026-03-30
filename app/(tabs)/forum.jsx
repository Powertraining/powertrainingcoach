import { View, StyleSheet } from "react-native";
import ForumPresenter from "../../src/screens/presenters/ForumPresenter.jsx";

export default function ForumScreen() {
  return (
    <View style={styles.container}>
      <ForumPresenter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
