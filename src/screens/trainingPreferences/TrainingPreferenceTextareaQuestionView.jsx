import { Text, TextInput, StyleSheet, View, useWindowDimensions } from "react-native";

export default function TrainingPreferenceTextareaQuestionView({
  label,
  helperText,
  placeholder,
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          multiline
          numberOfLines={3}
          style={styles.textarea}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#111827",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
  textarea: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.14)",
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
});
