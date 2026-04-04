import { StyleSheet, TouchableWithoutFeedback, View, Text } from "react-native";
import StandardText from "../../../components/textComponents/StandardText.jsx";

export default function CoachResponseView({ onClose }) {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.box}>
            <StandardText textColor="#C9B259" fontSize={24}>Coach Response</StandardText>
            <Text style={{fontSize: 17,  color: "#C9B259", marginTop: 10, textAlign: "center" }}>
              Coach Response shows that a verified coach has contributed to the thread, so you can weigh the advice with more confidence.
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    opacity: 0.75,
  },
  box: {
    width: "85%",
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    borderRadius: 45,
    padding: 40,
  },
});
