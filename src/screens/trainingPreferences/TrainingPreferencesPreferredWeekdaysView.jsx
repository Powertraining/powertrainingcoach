import {
  Text,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

import { WEEKDAY_OPTIONS } from "../../constants/weekdays.js";
import StandardText from "../../components/textComponents/StandardText.jsx";

const WEEKDAY_BUTTON_OPTIONS = WEEKDAY_OPTIONS.filter((option) => option.value);
const WEEKDAY_BUTTON_WIDTH = 44;
const WEEKDAY_BUTTON_GAP = 2;
const WEEKDAY_BUTTON_GROUP_WIDTH =
  WEEKDAY_BUTTON_OPTIONS.length * WEEKDAY_BUTTON_WIDTH +
  (WEEKDAY_BUTTON_OPTIONS.length - 1) * WEEKDAY_BUTTON_GAP;

export default function TrainingPreferencesPreferredWeekdaysView({
  daysPerWeek,
  preferredWeekdays,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.viewport, { height: screenHeight }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.section}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <View style={styles.header}>
            <StandardText fontSize={30} center>
              Preferred weekdays
            </StandardText>
            <StandardText style={styles.helperText} fontSize={18} center>
              Choose the weekday you prefer for each training day. Tap a
              selected weekday again to clear it.
            </StandardText>
          </View>
          <View style={styles.preferenceGrid}>
            {Array.from({ length: daysPerWeek }, (_, index) => (
              <View
                key={`preferred-weekday-${index + 1}`}
                style={styles.preferenceItem}
              >
                <View style={styles.weekdayGroup}>
                  <Text style={styles.preferenceLabel}>Day {index + 1}</Text>
                </View>
                <View style={styles.weekdayButtonRow}>
                  {WEEKDAY_BUTTON_OPTIONS.map((option) => {
                    const isSelected = preferredWeekdays[index] === option.value;

                    return (
                      <TouchableOpacity
                        key={`${option.value}-${index + 1}`}
                        activeOpacity={0.8}
                        onPress={() =>
                          onChange(index, isSelected ? "" : option.value)
                        }
                        style={[
                          styles.weekdayButton,
                          isSelected ? styles.weekdayButtonSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekdayButtonText,
                            isSelected
                              ? styles.weekdayButtonTextSelected
                              : null,
                          ]}
                        >
                          {option.label.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    justifyContent: "center",
    paddingTop: 80,
    paddingBottom: 60,
  },
  field: {
    gap: 26,
  },
  header: {
    gap: 8,
    paddingHorizontal: 26,
  },
  helperText: {
    lineHeight: 24,
  },
  preferenceGrid: {
    gap: 30,
  },
  preferenceItem: {
    gap: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  weekdayGroup: {
    width: WEEKDAY_BUTTON_GROUP_WIDTH,
    alignSelf: "center",
  },
  weekdayButtonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: WEEKDAY_BUTTON_GAP,
  },
  weekdayButton: {
    width: WEEKDAY_BUTTON_WIDTH,
    minHeight: 45,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  weekdayButtonSelected: {
    backgroundColor: "#ffffff",
  },
  weekdayButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  weekdayButtonTextSelected: {
    color: "#111827",
  },
});
