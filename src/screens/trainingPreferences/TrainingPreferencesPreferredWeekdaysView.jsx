import {
  Pressable,
  ScrollView,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { WEEKDAY_OPTIONS } from "../../constants/weekdays.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const WEEKDAY_CHIP_OPTIONS = WEEKDAY_OPTIONS.filter((option) => option.value);
const WEEKDAY_INDEX_BY_VALUE = Object.freeze(
  WEEKDAY_CHIP_OPTIONS.reduce((lookup, option, index) => {
    lookup[option.value] = index;
    return lookup;
  }, {})
);
const WEEKDAY_SEQUENCE_LENGTH = WEEKDAY_CHIP_OPTIONS.length;

function canBuildOrderedWeekdaySequence(preferredWeekdays = []) {
  const resolvedWeekdays = preferredWeekdays.map((weekday) =>
    weekday ? WEEKDAY_INDEX_BY_VALUE[weekday] : null
  );

  if (resolvedWeekdays.length > WEEKDAY_SEQUENCE_LENGTH) {
    return false;
  }

  function search(rowIndex, previousOffset, startWeekdayIndex) {
    if (rowIndex >= resolvedWeekdays.length) {
      return true;
    }

    const fixedWeekdayIndex = resolvedWeekdays[rowIndex];
    const remainingRows = resolvedWeekdays.length - rowIndex - 1;
    const maxSelectableOffset = WEEKDAY_SEQUENCE_LENGTH - 1 - remainingRows;

    for (
      let offset = previousOffset + 1;
      offset <= maxSelectableOffset;
      offset += 1
    ) {
      const weekdayIndex = (startWeekdayIndex + offset) % WEEKDAY_SEQUENCE_LENGTH;

      if (
        (fixedWeekdayIndex === null || fixedWeekdayIndex === weekdayIndex) &&
        search(rowIndex + 1, offset, startWeekdayIndex)
      ) {
        return true;
      }
    }

    return false;
  }

  return WEEKDAY_CHIP_OPTIONS.some((_, startWeekdayIndex) =>
    search(0, -1, startWeekdayIndex)
  );
}

export default function TrainingPreferencesPreferredWeekdaysView({
  daysPerWeek,
  preferredWeekdays,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <ScrollView
      style={[styles.section, { maxHeight: screenHeight }]}
      contentContainerStyle={[
        styles.sectionContent,
        { minHeight: screenHeight },
      ]}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <IBMPlexText titleBlock height={82}>Preferred weekdays</IBMPlexText>
        <IBMPlexText defaultWhite style={styles.helperText} textColor="#9ca3af" center>
          Optional. Choose fixed weekdays for training days that need them.
          Leave the rest flexible.
        </IBMPlexText>

        <View style={styles.preferenceBox}>
          <View style={styles.preferenceGrid}>
            {Array.from({ length: daysPerWeek }, (_, index) => (
              <View
                key={`preferred-weekday-${index + 1}`}
                style={styles.preferenceItem}
              >
                <IBMPlexText style={styles.preferenceLabel}>Day {index + 1}</IBMPlexText>
                <View style={styles.weekdayRow}>
                  {WEEKDAY_CHIP_OPTIONS.map((option) => {
                    const isSelected = preferredWeekdays[index] === option.value;
                    const isUnavailable =
                      !isSelected &&
                      !canBuildOrderedWeekdaySequence(
                        preferredWeekdays.map((weekday, selectedIndex) =>
                          selectedIndex === index ? option.value : weekday
                        )
                      );

                    return (
                      <Pressable
                        key={`${option.value}-${index + 1}`}
                        disabled={isUnavailable}
                        onPress={() =>
                          onChange(index, isSelected ? "" : option.value)
                        }
                        style={({ pressed }) => [
                          styles.weekdayButton,
                          isSelected ? styles.weekdayButtonSelected : null,
                          isUnavailable ? styles.weekdayButtonDisabled : null,
                          pressed ? styles.weekdayButtonPressed : null,
                        ]}
                      >
                        <IBMPlexText
                          style={[
                            styles.weekdayButtonText,
                            isSelected ? styles.weekdayButtonTextSelected : null,
                            isUnavailable ? styles.weekdayButtonTextDisabled : null,
                          ]}
                        >
                          {option.label.slice(0, 3)}
                        </IBMPlexText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
  },
  sectionContent: {
    justifyContent: "center",
    paddingBottom: 150,
    paddingTop: 24,
  },
  content: {
    gap: 4,
  },
  helperText: {
    alignSelf: "center",
    maxWidth: 320,
    marginBottom: 18,
    paddingHorizontal: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  preferenceBox: {
    alignSelf: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    gap: 12,
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: "90%",
  },
  preferenceGrid: {
    gap: 12,
  },
  preferenceItem: {
    gap: 6,
  },
  preferenceLabel: {
    color: "#8E8E8E",
    fontSize: 11, fontWeight: "700",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    width: "100%",
  },
  weekdayButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  weekdayButtonSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#fff",
  },
  weekdayButtonDisabled: {
    opacity: 1,
  },
  weekdayButtonPressed: {
    opacity: 0.78,
  },
  weekdayButtonText: {
    fontSize: 15, fontWeight: "700",
    color: "#fff",
  },
  weekdayButtonTextSelected: {
    color: "#000000",
  },
  weekdayButtonTextDisabled: {
    opacity: 0.2,
  },
});
