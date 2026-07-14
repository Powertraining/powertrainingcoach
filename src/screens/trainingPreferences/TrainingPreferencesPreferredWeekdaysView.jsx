import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useEffect, useRef, useState } from "react";

import { WEEKDAY_OPTIONS } from "../../constants/weekdays.js";
import { TRAINING_DAY_TYPE_META } from "../../constants/trainingDayTypes.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const WEEKDAY_CHIP_OPTIONS = WEEKDAY_OPTIONS.filter((option) => option.value);
const WEEKDAY_INDEX_BY_VALUE = Object.freeze(
  WEEKDAY_CHIP_OPTIONS.reduce((lookup, option, index) => {
    lookup[option.value] = index;
    return lookup;
  }, {})
);
const WEEKDAY_SEQUENCE_LENGTH = WEEKDAY_CHIP_OPTIONS.length;
const ENTRANCE_DURATION = 240;
const ENTRANCE_ROW_STAGGER = 42;
const CHIP_STATE_DURATION = 140;
const DAY_TYPE_OPTIONS = Object.freeze([
  TRAINING_DAY_TYPE_META.force,
  TRAINING_DAY_TYPE_META.power,
  Object.freeze({ ...TRAINING_DAY_TYPE_META.fatigue, label: "Endurance" }),
]);

function FadeInView({ children, delay = 0, travel = 12, style }) {
  const entranceProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entranceProgress.setValue(0);
    Animated.timing(entranceProgress, {
      toValue: 1,
      duration: ENTRANCE_DURATION,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, entranceProgress]);

  const animatedStyle = {
    opacity: entranceProgress,
    transform: [
      {
        translateY: entranceProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [travel, 0],
        }),
      },
    ],
  };

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

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

function WeekdayOptionButton({
  isSelected,
  isUnavailable,
  label,
  selectedColor,
  onPress,
}) {
  const selectedProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const unavailableProgress = useRef(
    new Animated.Value(isUnavailable ? 1 : 0)
  ).current;
  const pressProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(selectedProgress, {
      toValue: isSelected ? 1 : 0,
      duration: CHIP_STATE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isSelected, selectedProgress]);

  useEffect(() => {
    Animated.timing(unavailableProgress, {
      toValue: isUnavailable ? 1 : 0,
      duration: CHIP_STATE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isUnavailable, unavailableProgress]);

  function animatePress(toValue) {
    Animated.timing(pressProgress, {
      toValue,
      duration: toValue ? 80 : 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const availableOpacity = unavailableProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.2],
  });
  const whiteTextOpacity = Animated.multiply(
    selectedProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    availableOpacity
  );
  const blackTextOpacity = Animated.multiply(selectedProgress, availableOpacity);
  const animatedButtonStyle = {
    opacity: unavailableProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.72],
    }),
    transform: [
      {
        scale: Animated.add(
          selectedProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.02],
          }),
          pressProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -0.035],
          })
        ),
      },
    ],
  };

  return (
    <Pressable
      disabled={isUnavailable}
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      style={styles.weekdayButtonPressable}
    >
      <Animated.View style={[styles.weekdayButton, animatedButtonStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.weekdayButtonSelectedFill,
            selectedColor ? { backgroundColor: selectedColor, borderColor: selectedColor } : null,
            { opacity: selectedProgress },
          ]}
        />
        <View style={styles.weekdayButtonTextSlot}>
          <Animated.View
            style={[styles.weekdayButtonTextLayer, { opacity: whiteTextOpacity }]}
          >
            <IBMPlexText style={styles.weekdayButtonText}>{label}</IBMPlexText>
          </Animated.View>
          <Animated.View
            style={[styles.weekdayButtonTextLayer, { opacity: blackTextOpacity }]}
          >
            <IBMPlexText
              style={[styles.weekdayButtonText, styles.weekdayButtonTextSelected]}
            >
              {label}
            </IBMPlexText>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function TrainingPreferencesPreferredWeekdaysView({
  daysPerWeek,
  preferredWeekdays,
  preferredDayTypes,
  desiredTraining,
  enduranceSessionsPerWeek,
  onAssignmentChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [pendingAssignment, setPendingAssignment] = useState(null);
  const includesEndurance =
    desiredTraining === "endurance" ||
    desiredTraining === "strength_power_endurance";
  const enduranceTarget = includesEndurance
    ? Math.min(daysPerWeek, Math.max(1, Number(enduranceSessionsPerWeek) || 1))
    : 0;
  const strengthPowerTarget = daysPerWeek - enduranceTarget;
  const assignedEnduranceCount = preferredDayTypes.filter(
    (type) => type === "fatigue"
  ).length;
  const assignedStrengthPowerCount = preferredDayTypes.filter(
    (type) => type === "force" || type === "power"
  ).length;

  function isDayTypeUnavailable(type, rowIndex) {
    const currentType = preferredDayTypes[rowIndex];

    if (type === "fatigue") {
      return !includesEndurance ||
        (currentType !== "fatigue" && assignedEnduranceCount >= enduranceTarget);
    }

    return currentType !== "force" &&
      currentType !== "power" &&
      assignedStrengthPowerCount >= strengthPowerTarget;
  }

  function handleWeekdayPress(index, weekday, isSelected) {
    if (isSelected) {
      onAssignmentChange?.(index, "", "");
      setPendingAssignment(null);
      return;
    }

    setPendingAssignment({ index, weekday });
  }

  function assignDayType(type) {
    if (!pendingAssignment) {
      return;
    }

    onAssignmentChange?.(
      pendingAssignment.index,
      pendingAssignment.weekday,
      type
    );
    setPendingAssignment(null);
  }

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
        <FadeInView>
          <IBMPlexText titleBlock height={82}>Preferred weekdays</IBMPlexText>
        </FadeInView>
        <FadeInView delay={36} travel={8}>
          <IBMPlexText defaultWhite style={styles.helperText} textColor="#9ca3af" center>
            Optional. Choose a weekday, then assign the session type. Leave the
            rest flexible.
          </IBMPlexText>
        </FadeInView>

        <View style={styles.assignmentSummary}>
          <IBMPlexText style={styles.assignmentSummaryText}>
            Strength / Power {assignedStrengthPowerCount}/{strengthPowerTarget}
          </IBMPlexText>
          {includesEndurance ? (
            <IBMPlexText style={styles.assignmentSummaryText}>
              Endurance {assignedEnduranceCount}/{enduranceTarget}
            </IBMPlexText>
          ) : null}
        </View>

        <View style={styles.preferenceBox}>
          <View style={styles.preferenceGrid}>
            {Array.from({ length: daysPerWeek }, (_, index) => {
              const selectedType = preferredDayTypes[index] || "";
              const selectedTypeMeta = TRAINING_DAY_TYPE_META[selectedType];
              const isAssignmentMenuOpen = pendingAssignment?.index === index;

              return (
                <FadeInView
                  key={`preferred-weekday-${index + 1}`}
                  style={styles.preferenceItem}
                  delay={82 + index * ENTRANCE_ROW_STAGGER}
                  travel={14}
                >
                  <IBMPlexText
                    style={styles.preferenceLabel}
                  >
                    {selectedType === "fatigue" ? "Endurance" : selectedTypeMeta?.label || `Day ${index + 1}`}
                  </IBMPlexText>
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
                        <WeekdayOptionButton
                          key={`${option.value}-${index + 1}`}
                          isSelected={isSelected}
                          isUnavailable={isUnavailable}
                          label={option.label.slice(0, 3)}
                          selectedColor={selectedTypeMeta?.color}
                          onPress={() =>
                            handleWeekdayPress(index, option.value, isSelected)
                          }
                        />
                      );
                    })}
                  </View>
                  {isAssignmentMenuOpen ? (
                    <View style={styles.dayTypeMenu}>
                      <IBMPlexText style={styles.dayTypeMenuTitle}>
                        What type of session is this?
                      </IBMPlexText>
                      <View style={styles.dayTypeOptions}>
                        {DAY_TYPE_OPTIONS.map((typeOption) => {
                          const isUnavailable = isDayTypeUnavailable(
                            typeOption.value,
                            index
                          );

                          return (
                            <Pressable
                              key={typeOption.value}
                              disabled={isUnavailable}
                              onPress={() => assignDayType(typeOption.value)}
                              style={({ pressed }) => [
                                styles.dayTypeOption,
                                { borderColor: typeOption.color },
                                isUnavailable ? styles.dayTypeOptionUnavailable : null,
                                pressed ? styles.dayTypeOptionPressed : null,
                              ]}
                            >
                              <View
                                style={[
                                  styles.dayTypeDot,
                                  { backgroundColor: typeOption.color },
                                ]}
                              />
                              <IBMPlexText style={styles.dayTypeOptionText}>
                                {typeOption.label}
                              </IBMPlexText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </FadeInView>
              );
            })}
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
    marginBottom: 30,
    paddingHorizontal: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  assignmentSummary: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 18,
    marginBottom: 14,
  },
  assignmentSummaryText: {
    color: "#C9B259",
    fontSize: 12,
    fontWeight: "700",
  },
  dayTypeMenu: {
    backgroundColor: "#202020",
    borderColor: "#3b3b3b",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
    padding: 12,
  },
  dayTypeMenuTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  dayTypeOptions: {
    flexDirection: "row",
    gap: 8,
  },
  dayTypeOption: {
    alignItems: "center",
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 5,
  },
  dayTypeOptionUnavailable: {
    opacity: 0.25,
  },
  dayTypeOptionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  dayTypeDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  dayTypeOptionText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
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
    color: "#C9B259",
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
  weekdayButtonPressable: {
    borderRadius: 8,
    flex: 1,
    minWidth: 0,
  },
  weekdayButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    overflow: "hidden",
    paddingHorizontal: 2,
    width: "100%",
  },
  weekdayButtonSelectedFill: {
    backgroundColor: "#ffffff",
    borderColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  weekdayButtonTextSlot: {
    alignItems: "center",
    height: 20,
    justifyContent: "center",
    width: "100%",
  },
  weekdayButtonTextLayer: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  weekdayButtonText: {
    fontSize: 15, fontWeight: "700",
    color: "#fff",
  },
  weekdayButtonTextSelected: {
    color: "#ffffff",
  },
});
