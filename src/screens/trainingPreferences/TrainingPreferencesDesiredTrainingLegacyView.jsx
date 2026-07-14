import {
  DESIRED_TRAINING_OPTIONS } from "../../constants/trainingPreferences.js";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const DESIRED_TRAINING_ICONS = Object.freeze({
  endurance: require("../../assets/icons/sports/power.png"),
  strength_power: require("../../assets/icons/sports/fitness.png"),
  strength_power_endurance: require("../../assets/icons/sports/balance.png"),
});

const DESIRED_TRAINING_LABELS = Object.freeze({
  endurance: "Endurance",
  strength_power: "Power",
  strength_power_endurance: "Balance",
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

function FocusIcon({ type, isSelected }) {
  return (
    <View style={styles.iconCanvas}>
      <Image
        source={DESIRED_TRAINING_ICONS[type]}
        style={[
          styles.focusIcon,
          isSelected ? styles.focusIconSelected : null,
        ]}
      />
    </View>
  );
}

export default function TrainingPreferencesDesiredTrainingLegacyView({
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
                  <FocusIcon type={option.value} isSelected={isSelected} />
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
  focusIcon: {
    width: 92,
    height: 92,
    resizeMode: "contain",
    tintColor: "#000000",
  },
  focusIconSelected: {
    tintColor: "#000000",
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
