import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

export default function LoadedJumpGuideline({ compact = false }) {
  return (
    <View style={[styles.container, compact ? styles.compactContainer : null]}>
      <View style={styles.icon}>
        <Ionicons color="#4DA3FF" name="information" size={18} />
      </View>
      <View style={styles.copy}>
        <IBMPlexText style={styles.title}>Loaded-jump guideline</IBMPlexText>
        <IBMPlexText style={styles.text}>
          Use % body mass (BM) for the total external load (bar + plates), not % of 1RM.
        </IBMPlexText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    backgroundColor: "rgba(33, 150, 243, 0.08)",
    borderColor: "#2588E8",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  compactContainer: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  icon: {
    alignItems: "center",
    borderColor: "#2588E8",
    borderRadius: 999,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    marginTop: 1,
    width: 26,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    color: "#4DA3FF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15,
  },
  text: {
    color: "#E7E7EA",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
});
