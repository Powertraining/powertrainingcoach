import {
  DESIRED_TRAINING_OPTIONS } from "../../constants/trainingPreferences.js";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const DESIRED_TRAINING_LABELS = Object.freeze({
  endurance: "Endurance",
  strength_power: "Power",
  strength_power_endurance: "Both",
});

const OPTION_FACE_HEIGHT = 288;
const OPTION_ICON_SLIDE_OFFSET = 10;
const OPTION_ANIMATION_DURATION = 220;
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function getOptionSlideOffset(optionIndex, selectedIndex) {
  if (selectedIndex < 0 || selectedIndex === optionIndex) {
    return 0;
  }

  return optionIndex < selectedIndex
    ? -OPTION_ICON_SLIDE_OFFSET
    : OPTION_ICON_SLIDE_OFFSET;
}

function FocusIcon({ type }) {
  if (type === "endurance") {
    return (
      <View style={styles.iconCanvas}>
        <View style={[styles.speedLine, styles.speedLineLong]} />
        <View style={[styles.speedLine, styles.speedLineMedium]} />
        <View style={[styles.speedLine, styles.speedLineShort]} />
        <View style={styles.enduranceRing}>
          <View style={styles.enduranceDot} />
        </View>
      </View>
    );
  }

  if (type === "strength_power_endurance") {
    return (
      <View style={styles.iconCanvas}>
        <View style={styles.balancePowerIcon}>
          <View style={styles.miniPlate} />
          <View style={styles.miniBar} />
          <View style={styles.miniPlate} />
        </View>
        <View style={styles.balanceEnduranceIcon}>
          <View style={[styles.balanceLine, styles.balanceLineLong]} />
          <View style={[styles.balanceLine, styles.balanceLineShort]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.iconCanvas}>
      <View style={styles.powerIcon}>
        <View style={styles.powerPlate} />
        <View style={styles.powerBar} />
        <View style={styles.powerPlate} />
      </View>
    </View>
  );
}

export default function TrainingPreferencesDesiredTrainingView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const displayedValue = isSelectionCleared ? null : value;
  const selectedIndex = DESIRED_TRAINING_OPTIONS.findIndex(
    (option) => option.value === displayedValue
  );
  const optionAnimations = useRef(
    DESIRED_TRAINING_OPTIONS.map((_, index) => ({
      flex: new Animated.Value(index === selectedIndex ? 1 : 0),
      slide: new Animated.Value(getOptionSlideOffset(index, selectedIndex)),
    }))
  ).current;

  useEffect(() => {
    const animations = optionAnimations.flatMap((optionAnimation, index) => {
      optionAnimation.flex.stopAnimation();
      optionAnimation.slide.stopAnimation();

      return [
        Animated.timing(optionAnimation.flex, {
          toValue: index === selectedIndex ? 1 : 0,
          duration: OPTION_ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(optionAnimation.slide, {
          toValue: getOptionSlideOffset(index, selectedIndex),
          duration: OPTION_ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ];
    });

    Animated.parallel(animations).start();
  }, [optionAnimations, selectedIndex]);

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <IBMPlexText titleBlock height={140}>What would you like to focus on?</IBMPlexText>
      <IBMPlexText defaultWhite style={styles.helperText} center>
        Choose what your plan should prioritize so training matches your goals.
      </IBMPlexText>

      <View style={styles.options}>
        {DESIRED_TRAINING_OPTIONS.map((option, index) => {
          const isSelected = displayedValue === option.value;
          const optionAnimation = optionAnimations[index];
          const optionFlexStyle = {
            flex: optionAnimation.flex.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 2],
            }),
          };
          const optionIconPositionStyle = {
            transform: [
              {
                translateX: optionAnimation.slide,
              },
            ],
          };
          const optionPositionStyle =
            index === 0
              ? styles.optionFaceLeft
              : index === DESIRED_TRAINING_OPTIONS.length - 1
                ? styles.optionFaceRight
                : styles.optionFaceMiddle;

          return (
            <AnimatedTouchableOpacity
              key={option.value}
              onPress={() => {
                setIsSelectionCleared(isSelected);
                onChange?.(isSelected ? null : option.value);
              }}
              style={[
                styles.optionButton,
                optionFlexStyle,
              ]}
            >
              <View
                style={[
                  styles.optionFace,
                  optionPositionStyle,
                  isSelected ? styles.optionFaceSelected : null,
                ]}
              >
                <Animated.View
                  style={[styles.optionIconRow, optionIconPositionStyle]}
                >
                  <FocusIcon type={option.value} />
                </Animated.View>
              </View>
              <IBMPlexText defaultWhite
                style={[
                  styles.optionText,
                  isSelected ? styles.optionTextSelected : null,
                ]}
                center
              >
                {DESIRED_TRAINING_LABELS[option.value] ?? option.label}
              </IBMPlexText>
            </AnimatedTouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  options: {
    width: "100%",
    flexDirection: "row",
    gap: 2,
    marginTop: 68,
  },
  helperText: {
    width: "82%",
    alignSelf: "center",
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  optionButton: {
    flex: 1,
    minHeight: 58,
    position: "relative",
    overflow: "visible",
    alignItems: "center",
  },
  optionFace: {
    width: "100%",
    minHeight: OPTION_FACE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    zIndex: 1,
    overflow: "hidden",
  },
  optionIconRow: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconCanvas: {
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  powerIcon: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    transform: [{ rotate: "-28deg" }],
  },
  powerBar: {
    width: 78,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#000000",
  },
  powerPlate: {
    width: 20,
    height: 54,
    borderRadius: 7,
    backgroundColor: "#000000",
  },
  speedLine: {
    position: "absolute",
    height: 12,
    borderRadius: 999,
    backgroundColor: "#000000",
    left: 14,
  },
  speedLineLong: {
    top: 34,
    width: 72,
  },
  speedLineMedium: {
    top: 58,
    width: 54,
  },
  speedLineShort: {
    top: 82,
    width: 36,
  },
  enduranceRing: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 10,
    borderColor: "#000000",
    marginLeft: 52,
  },
  enduranceDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#000000",
    alignSelf: "center",
    marginTop: 12,
  },
  balancePowerIcon: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    transform: [{ rotate: "-22deg" }, { translateY: -14 }],
  },
  miniBar: {
    width: 58,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#000000",
  },
  miniPlate: {
    width: 16,
    height: 38,
    borderRadius: 6,
    backgroundColor: "#000000",
  },
  balanceEnduranceIcon: {
    alignItems: "flex-start",
    marginTop: 20,
    transform: [{ translateX: 8 }],
  },
  balanceLine: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#000000",
    marginTop: 10,
  },
  balanceLineLong: {
    width: 76,
  },
  balanceLineShort: {
    width: 46,
  },
  optionFaceLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  optionFaceMiddle: {
    borderRadius: 2,
  },
  optionFaceRight: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  optionFaceSelected: {
    backgroundColor: "#C9B259",
  },
  optionText: {
    width: "100%",
    marginTop: 12,
    color: "#ffffff",
    fontSize: 17,
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#ffffff",
  },
});
