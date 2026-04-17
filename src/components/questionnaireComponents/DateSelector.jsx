import { TextInput, StyleSheet } from "react-native";

export default function DateSelector({
  value = "",
  onChange,
  placeholder = "e.g. 2026-06-20 or 8 weeks out",
}) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={(nextValue) => onChange?.(nextValue)}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.14)",
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
});
