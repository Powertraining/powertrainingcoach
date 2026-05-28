import { TouchableOpacity, StyleSheet } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
const BUTTON_RADIUS = 35;

export default function SideButton({
  label,
  isSelected,
  onPress,
  side = "left",
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.option,
        side === "right" ? styles.optionRight : styles.optionLeft,
        isSelected ? styles.optionSelected : styles.optionUnselected,
      ]}
    >
      <IBMPlexText
        style={[
          styles.optionText,
          side === "right" ? styles.optionTextRight : styles.optionTextLeft,
          isSelected ? styles.optionTextSelected : null,
        ]}
      >
        {label}
      </IBMPlexText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    height: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1.2,
    borderColor: "#585858",
    borderStyle: "dashed",
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLeft: {
    alignSelf: "flex-start",
    marginLeft: -BUTTON_RADIUS,
  },
  optionRight: {
    alignSelf: "flex-end",
    marginRight: -BUTTON_RADIUS,
  },
  optionUnselected: {
    width: "50%",
  },
  optionSelected: {
    width: "80%",
    borderColor: "#ffffff",
    borderStyle: "solid",
  },
  optionText: {
    color: "#8E8E8E",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 38,
    includeFontPadding: false,
    textAlignVertical: "center",
    width: "100%",
  },
  optionTextLeft: {
    paddingRight: BUTTON_RADIUS / 2,
    textAlign: "right",
  },
  optionTextRight: {
    paddingLeft: BUTTON_RADIUS / 2,
    textAlign: "left",
  },
  optionTextSelected: {
    color: "#ffffff",
  },
});
