import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
export default function TrainingPreferencePickerQuestionView({
  label,
  helperText,
  options,
  value,
  onChange,
  eyebrow,
  pickerStyle,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <View style={styles.field}>
        {eyebrow ? <IBMPlexText style={styles.eyebrow}>{eyebrow}</IBMPlexText> : null}
        <IBMPlexText style={styles.label}>{label}</IBMPlexText>
        {helperText ? <IBMPlexText style={styles.helperText}>{helperText}</IBMPlexText> : null}
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={[styles.input, pickerStyle]}
        >
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
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
  eyebrow: {
    fontSize: 13, fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  label: {
    color: "#111827",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
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
