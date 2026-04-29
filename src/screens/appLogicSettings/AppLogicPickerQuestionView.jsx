import { Picker } from "@react-native-picker/picker";
import { Text, StyleSheet, View, useWindowDimensions } from "react-native";

import TitleText from "../../components/textComponents/TitleText.jsx";

function OptionDescription({ options, value }) {
  const selectedOption = options.find((option) => option.value === value);

  if (!selectedOption?.description) {
    return null;
  }

  return <Text style={styles.helperText}>{selectedOption.description}</Text>;
}

export default function AppLogicPickerQuestionView({
  title,
  helperText,
  options,
  value,
  onChange,
  footerText,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <TitleText height={130}>{title}</TitleText>
      <View style={styles.contentSlot}>
        {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.input}
        >
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
        <OptionDescription options={options} value={value} />
        {footerText ? <Text style={styles.helperText}>{footerText}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
    paddingBottom: 120,
  },
  contentSlot: {
    gap: 8,
    height: 300,
    justifyContent: "center",
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
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
});
