import { Text, TouchableOpacity, StyleSheet } from "react-native";

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
    height: 125,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 30,
    borderWidth: 1.2,
    borderColor: "#585858",
    borderStyle: "dashed",
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLeft: {
    alignSelf: "flex-start",
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  optionRight: {
    alignSelf: "flex-end",
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
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
