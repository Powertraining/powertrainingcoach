import {
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
    description: "Little to no lifting or conditioning experience",
  },
  {
    value: "intermediate",
    label: "AVERAGE",
    description: "Has some experience with strength and conditioning",
  },
  {
    value: "advanced",
    label: "ADVANCED",
    description: "Very experienced with strength and conditioning",
  },
]);

const VISUAL_ORDER = Object.freeze([
  "intermediate",
  "advanced",
  "beginner",
]);

function getActiveIndex(value) {
  const foundIndex = EXPERIENCE_ORDER.findIndex((option) => option.value === value);
  return foundIndex >= 0 ? foundIndex : 0;
}

function getVisualIndex(value) {
  const foundIndex = VISUAL_ORDER.findIndex((optionValue) => optionValue === value);
  return foundIndex >= 0 ? foundIndex : 0;
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
        <Pressable
          onPress={() => moveSelection(-1)}
          disabled={activeVisualIndex === 0}
          style={styles.button}
        >
          <View style={styles.arrowShadow} />
          <View style={styles.arrowWrap}>
            <Image
              source={ARROW_IMAGE}
              style={[styles.arrowImage, styles.arrowImageLeft, styles.arrowImageLeftOffset]}
              resizeMode="contain"
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => moveSelection(1)}
          disabled={activeVisualIndex === VISUAL_ORDER.length - 1}
          style={styles.button}
        >
          <View style={styles.arrowShadow} />
          <View style={styles.arrowWrap}>
            <Image
              source={ARROW_IMAGE}
              style={[styles.arrowImage, styles.arrowImageRightOffset]}
              resizeMode="contain"
            />
          </View>
        </Pressable>
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
  },
  optionCard: {
    position: "relative",
    width: 96,
    overflow: "visible",
  },
  optionCardLeft: {
    height: 56,
  },
  optionCardMiddle: {
    height: 112,
  },
  optionCardRight: {
    height: 45,
  },
  optionShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: "#E1E1E1",
    transform: [{ translateX: -10 }, { translateY: -10 }],
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
    justifyContent: "center",
    paddingTop: 0,
  },
  optionFaceMiddle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  optionFaceRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: "center",
    paddingTop: 0,
  },
  optionText: {
    width: "100%",
    marginTop: 5,
    fontFamily: fonts.display,
    fontSize: OPTION_LABEL_FONT_SIZE,
    lineHeight: 14,
    textAlign: "center",
    includeFontPadding: false,
  },
  optionTextLeft: {
    marginTop: -4,
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
