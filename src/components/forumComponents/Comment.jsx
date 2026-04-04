import { StyleSheet, View } from "react-native";
import StandardText from "../textComponents/StandardText.jsx";

export default function Comment({ comment }) {
  if (!comment) {
    return null;
  }

  return (
    <View style={styles.comment}>
      <StandardText style={styles.name}>{comment?.authorDisplayName}</StandardText>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  name: {
    fontSize: 18,
    color: "#fff",
  },
});
