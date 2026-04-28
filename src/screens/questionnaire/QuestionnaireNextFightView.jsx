import { Text, View, StyleSheet, useWindowDimensions } from "react-native";

import DateSelector from "../../components/questionnaireComponents/DateSelector.jsx";

export default function QuestionnaireNextFightView({
  value = "",
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <View style={styles.field}>
        <Text style={styles.label}>Next fight</Text>
        <DateSelector
          value={value}
          onChange={onChange}
        />
        <Text style={styles.helperText}>
          Share a date or timeline so the app can plan the camp appropriately.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
    justifyContent: "center",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
});
