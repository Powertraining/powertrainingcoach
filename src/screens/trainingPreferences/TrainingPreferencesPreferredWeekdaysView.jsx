import {
  Pressable,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { WEEKDAY_OPTIONS } from "../../constants/weekdays.js";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

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
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <View style={styles.field}>
        <TitleText height={130}>Day Guidelines</TitleText>
        <StandardText style={styles.helperText} textColor="#C9B259" center>
          Optional. The plan still runs as Day 1, Day 2, Day 3, and so on.
          These only add calendar guidance.
        </StandardText>
        <View style={styles.preferenceGrid}>
          {Array.from({ length: daysPerWeek }, (_, index) => (
            <View
              key={`preferred-weekday-${index + 1}`}
              style={styles.preferenceItem}
            >
              <Text style={styles.preferenceLabel}>Day {index + 1}</Text>
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
                        isSelected && styles.weekdayButtonSelected,
                        isUnavailable && styles.weekdayButtonDisabled,
                        pressed && styles.weekdayButtonPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayButtonText,
                          isSelected && styles.weekdayButtonTextSelected,
                          isUnavailable && styles.weekdayButtonTextDisabled,
                        ]}
                      >
                        {option.label.slice(0, 3)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
  },
  field: {
    gap: 8,
  },
  helperText: {
    alignSelf: "center",
    maxWidth: 320,
    marginBottom: 18,
    paddingHorizontal: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  preferenceGrid: {
    gap: 10,
  },
  preferenceItem: {
    gap: 6,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  weekdayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  weekdayButton: {
    minWidth: 43,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 9,
    backgroundColor: "transparent",
  },
  weekdayButtonSelected: {
    backgroundColor: "#fff",
  },
  weekdayButtonPressed: {
    opacity: 0.78,
  },
  weekdayButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  weekdayButtonTextSelected: {
    color: "#000",
  },
  weekdayButtonTextDisabled: {
    opacity: 0.2,
  },
});
