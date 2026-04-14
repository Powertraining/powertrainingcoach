import { Text, TouchableOpacity, StyleSheet } from "react-native";

export default function QuestionnaireOptionChip({
  label,
  selected = false,
  onPress,
  side = "left",
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        side === "left" ? styles.chipLeft : null,
        side === "right" ? styles.chipRight : null,
        selected ? styles.chipSelected : null,
      ]}
    >
      <Text
        style={[styles.chipText, selected ? styles.chipTextSelected : null]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 40,
    borderWidth:1.8,
    height: 100,
    borderStyle: "dashed",
    borderColor: "#585858",
    backgroundColor: "#585858",
    justifyContent: "center"
  },
  chipLeft: {
    borderStyle: "dashed",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    left: -10,
  },
  chipRight: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    right: -10,
  },
  chipSelected: {
    borderColor: "#000000",
    backgroundColor: "#fff",
  },
  chipText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  chipTextSelected: {
    color: "#000",
  },
});
