import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useEffect, useRef } from "react";

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
const ENTRANCE_DURATION = 240;
const ENTRANCE_ROW_STAGGER = 42;
const CHIP_STATE_DURATION = 140;

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
        <FadeInView>
          <IBMPlexText titleBlock height={82}>Preferred weekdays</IBMPlexText>
        </FadeInView>
        <FadeInView delay={36} travel={8}>
          <IBMPlexText defaultWhite style={styles.helperText} textColor="#9ca3af" center>
            Optional. Choose fixed weekdays for training days that need them.
            Leave the rest flexible.
          </IBMPlexText>
        </FadeInView>

        <View style={styles.preferenceBox}>
          <View style={styles.preferenceGrid}>
            {Array.from({ length: daysPerWeek }, (_, index) => {
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
                    Day {index + 1}
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
                          onPress={() =>
                            onChange(index, isSelected ? "" : option.value)
                          }
                        />
                      );
                    })}
                  </View>
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
    color: "#000000",
  },
});
