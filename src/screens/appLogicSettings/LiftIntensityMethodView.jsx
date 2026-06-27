import {
  useEffect,
  useRef,
} from "react";
import {
  LIFT_INTENSITY_METHOD_OPTIONS,
} from "../../constants/appLogicSettings.js";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const LIFT_INTENSITY_MEDIA_TEXT = Object.freeze({
  percentage: "%",
  rpe: "RPE",
});

const TITLE_BLOCK_HEIGHT = 196;
const SECTION_TOP_PADDING = 52;
const OPTIONS_BOTTOM_CLEARANCE = 132;
const LIFT_INTENSITY_BUTTONS = Object.freeze({
  rpe: {
    label: "Adjust by effort",
  },
  percentage: {
    label: "Use percentages",
  },
});
const LIFT_INTENSITY_DISPLAY_ORDER = Object.freeze(["rpe", "percentage"]);

function FadeInOption({ children, delay = 0 }) {
  const enterProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enterProgress.setValue(0);
    Animated.timing(enterProgress, {
      toValue: 1,
      duration: 360,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, enterProgress]);

  const animatedStyle = {
    opacity: enterProgress,
    transform: [
      {
        translateY: enterProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.fadeInOption, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export default function LiftIntensityMethodView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <IBMPlexText titleBlock height={TITLE_BLOCK_HEIGHT}>Lift intensity method</IBMPlexText>
      <ScrollView
        style={styles.optionsScroll}
        contentContainerStyle={styles.contentSlot}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {LIFT_INTENSITY_DISPLAY_ORDER.map((optionValue, index) => {
          const option = LIFT_INTENSITY_METHOD_OPTIONS.find(
            (methodOption) => methodOption.value === optionValue
          );
          if (!option) {
            return null;
          }

          const buttonContent = LIFT_INTENSITY_BUTTONS[option.value];

          return (
            <FadeInOption key={option.value} delay={index * 70}>
              <PreferenceOptionButton
                isSelected={value === option.value}
                label={buttonContent?.label ?? option.label}
                mediaText={LIFT_INTENSITY_MEDIA_TEXT[option.value]}
                buttonStyle={styles.optionButton}
                selectedButtonStyle={styles.optionButtonSelected}
                labelStyle={styles.optionLabel}
                mediaTextStyle={styles.optionMediaText}
                description={option.description}
                onPress={() =>
                  onChange?.(value === option.value ? null : option.value)
                }
              />
            </FadeInOption>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "flex-start",
    paddingTop: SECTION_TOP_PADDING,
  },
  optionsScroll: {
    alignSelf: "stretch",
    flex: 1,
  },
  contentSlot: {
    gap: 14,
    justifyContent: "flex-start",
    paddingBottom: OPTIONS_BOTTOM_CLEARANCE,
  },
  fadeInOption: {
    width: "100%",
  },
  optionButton: {
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 2,
    minHeight: 132,
  },
  optionButtonSelected: {
    backgroundColor: "#181818",
    borderColor: "#ffffff",
  },
  optionLabel: {
    bottom: "auto",
    color: "#A6A6A6",
    fontSize: 13, fontWeight: "800",
    lineHeight: 16,
    position: "relative",
    textTransform: "uppercase",
  },
  optionMediaText: {
    fontSize: 26,
    marginBottom: 8,
  },
});
