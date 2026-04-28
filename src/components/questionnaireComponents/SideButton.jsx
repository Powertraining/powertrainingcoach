import { Text, TouchableOpacity, StyleSheet } from "react-native";

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
      <Text
        style={[
          styles.optionText,
          isSelected ? styles.optionTextSelected : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    height: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1.6,
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
    backgroundColor: "#ffffff",
    borderStyle: "solid",
  },
  optionText: {
    color: "#8E8E8E",
    fontFamily: "BebasNeue",
    fontSize: 24,
    lineHeight: 24,
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#000000",
  },
});
