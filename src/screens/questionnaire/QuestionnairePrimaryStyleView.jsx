import { Text, View, StyleSheet } from "react-native";

import QuestionnaireOptionChip from "../../components/questionnaireComponents/QuestionnaireOptionChip.jsx";
import { PRIMARY_STYLE_OPTIONS } from "../../constants/trainingPreferences.js";

const ACTIVE_PRIMARY_STYLE_OPTIONS = [...PRIMARY_STYLE_OPTIONS];

export default function QuestionnairePrimaryStyleView({
  value,
  onChange,
  title = "Primary style focus",
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.chipGroup}>
        {ACTIVE_PRIMARY_STYLE_OPTIONS.map((option, index) => {
          const selected = value === option.value;
          const side = index % 2 === 0 ? "left" : "right";

          return (
            <QuestionnaireOptionChip
              key={option.value}
              label={option.label}
              selected={selected}
              side={side}
              onPress={() => onChange?.(option.value)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    color: "#111827",
  },
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
