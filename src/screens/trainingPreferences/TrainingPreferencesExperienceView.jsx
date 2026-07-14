import { useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
import { fonts } from "../../theme/colors.js";
const ARROW_IMAGE = require("../../assets/icons/arrow.png");
const OPTION_LABEL_FONT_SIZE = 12;

const EXPERIENCE_ORDER = Object.freeze([
  {
    value: "beginner",
    label: "BEGINNER",
    description:
      "You are newer to structured S&C. Focus: Basic strength, foundation building, and consistency.",
  },
  {
    value: "intermediate",
    label: "INTERMEDIATE",
    description:
      "You have some S&C experience and are comfortable with common lifts, intervals, and progressive loading while managing sport fatigue.",
  },
  {
    value: "advanced",
    label: "ADVANCED",
    description:
      "You have strong S&C experience and are confident with heavy lifts, power work, plyometrics, and high-intensity conditioning.",
  },
]);

const VISUAL_ORDER = Object.freeze([
  "intermediate",
  "advanced",
  "beginner",
]);
const DEFAULT_VISUAL_INDEX = VISUAL_ORDER.indexOf(EXPERIENCE_ORDER[0].value);

function getActiveIndex(value) {
  const foundIndex = EXPERIENCE_ORDER.findIndex((option) => option.value === value);
  return foundIndex >= 0 ? foundIndex : 0;
}

function getVisualIndex(value) {
  const foundIndex = VISUAL_ORDER.findIndex((optionValue) => optionValue === value);
  return foundIndex >= 0 ? foundIndex : DEFAULT_VISUAL_INDEX;
}

function OptionCard({ children, position, isSelected }) {
  const optionCardPositionStyle =
    position === "left"
      ? styles.optionCardLeft
      : position === "middle"
        ? styles.optionCardMiddle
        : styles.optionCardRight;
  const optionShadowPositionStyle =
    position === "left"
      ? styles.optionShadowLeft
      : position === "middle"
        ? styles.optionShadowMiddle
        : styles.optionShadowRight;
  const optionFacePositionStyle =
    position === "left"
      ? styles.optionFaceLeft
      : position === "middle"
        ? styles.optionFaceMiddle
        : styles.optionFaceRight;
  const optionTextPositionStyle =
    position === "left" ? styles.optionTextLeft : null;

  return (
    <View
      style={[
        styles.optionCard,
        optionCardPositionStyle,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.optionShadow,
          optionShadowPositionStyle,
          isSelected ? styles.optionShadowSelected : null,
        ]}
      />
      <View
        style={[
          styles.optionFace,
          optionFacePositionStyle,
          isSelected ? styles.optionFaceSelected : null,
        ]}
      >
        <IBMPlexText defaultWhite
          style={[styles.optionText, optionTextPositionStyle]}
          textColor="#000000"
          numberOfLines={1}
        >
          {children}
        </IBMPlexText>
      </View>
    </View>
  );
}

function ArrowButton({ disabled, imageStyle, onPress }) {
  const pressProgress = useRef(new Animated.Value(0)).current;
  const arrowTranslate = {
    transform: [
      {
        translateX: pressProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
      {
        translateY: pressProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
    ],
  };

  function animatePress(toValue) {
    Animated.timing(pressProgress, {
      toValue,
      duration: toValue ? 70 : 120,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      disabled={disabled}
      style={styles.button}
    >
      <View style={styles.arrowShadow} />
      <Animated.View style={[styles.arrowWrap, arrowTranslate]}>
        <Image
          source={ARROW_IMAGE}
          style={[styles.arrowImage, imageStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </Pressable>
  );
}

export default function TrainingPreferencesExperienceView({
  value,
  onChange,
}) {
  const activeIndex = getActiveIndex(value);
  const activeVisualIndex = getVisualIndex(value);
  const activeOption = EXPERIENCE_ORDER[activeIndex];

  function moveSelection(direction) {
    const nextIndex = Math.min(
      VISUAL_ORDER.length - 1,
      Math.max(0, activeVisualIndex + direction)
    );
    onChange?.(VISUAL_ORDER[nextIndex]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <IBMPlexText style={styles.titleText}>
          Rate your strength & conditioning level
        </IBMPlexText>
      </View>

      <View style={styles.optionsRow}>
        <OptionCard position="left" isSelected={activeIndex === 1}>
          {EXPERIENCE_ORDER[1].label}
        </OptionCard>
        <OptionCard position="middle" isSelected={activeIndex === 2}>
          {EXPERIENCE_ORDER[2].label}
        </OptionCard>
        <OptionCard position="right" isSelected={activeIndex === 0}>
          {EXPERIENCE_ORDER[0].label}
        </OptionCard>
      </View>

      <IBMPlexText defaultWhite style={styles.descriptionText} textColor="#C9B259" center>
        {activeOption.description}
      </IBMPlexText>

      <View style={styles.buttonsRow}>
        <ArrowButton
          onPress={() => moveSelection(-1)}
          disabled={activeVisualIndex === 0}
          imageStyle={[styles.arrowImageLeft, styles.arrowImageLeftOffset]}
        />

        <ArrowButton
          onPress={() => moveSelection(1)}
          disabled={activeVisualIndex === VISUAL_ORDER.length - 1}
          imageStyle={styles.arrowImageRightOffset}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
  },
  titleWrap: {
    width: 225,
    alignSelf: "center",
    height: 230,
    justifyContent: "flex-start",
    paddingTop: 35,
  },
  titleText: {
    color: "#ffffff",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 35,
    lineHeight: 39,
    textAlign: "center",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: 2,
  },
  optionCard: {
    position: "relative",
    width: 100,
    overflow: "visible",
  },
  optionCardLeft: {
    height: 76,
  },
  optionCardMiddle: {
    height: 136,
  },
  optionCardRight: {
    height: 38,
  },
  optionShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: "#BDBDBD",
    transform: [{ translateX: -8 }, { translateY: -12 }],
    zIndex: 0,
  },
  optionShadowSelected: {
    backgroundColor: "#8B7B3E",
  },
  optionShadowLeft: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  optionShadowMiddle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  optionShadowRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  optionFace: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 8,
    overflow: "hidden",
    zIndex: 1,
  },
  optionFaceSelected: {
    backgroundColor: "#C9B259",
  },
  optionFaceLeft: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 15,
  },
  optionFaceMiddle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 16,
  },
  optionFaceRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingTop: 6,
  },
  optionText: {
    width: "100%",
    marginTop: 5,
    fontFamily: fonts.bodyBold,
    fontSize: OPTION_LABEL_FONT_SIZE,
    lineHeight: 14,
    textAlign: "center",
    includeFontPadding: false,
  },
  optionTextLeft: {
    marginTop: 0,
  },
  descriptionText: {
    marginTop: 84,
    marginBottom: 42,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    position: "relative",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  arrowShadow: {
    position: "absolute",
    left: 3,
    top: 3,
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E1E1E1",
    zIndex: 0,
  },
  arrowWrap: {
    position: "relative",
    backgroundColor: "#ffffff",
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  arrowImage: {
    width: 34,
    height: 34,
  },
  arrowImageLeft: {
    transform: [{ rotate: "180deg" }],
  },
  arrowImageLeftOffset: {
    marginLeft: -6,
  },
  arrowImageRightOffset: {
    marginLeft: 6,
  },
});
