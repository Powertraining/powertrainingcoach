import { Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const ARROW_IMAGE = require("../../assets/icons/arrow.png");

const EXPERIENCE_ORDER = Object.freeze([
  {
    value: "beginner",
    label: "BEGINNER",
    description: "Little to no lifting or conditioning experience",
  },
  {
    value: "intermediate",
    label: "INTERMEDIATE",
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
      <View style={[styles.optionFace, optionFacePositionStyle]}>
        <StandardText
          style={[styles.optionText, optionTextPositionStyle]}
          textColor="#000000"
        >
          {children}
        </StandardText>
      </View>
    </View>
  );
}

export default function TrainingPreferencesExperienceView({
  value,
  onChange,
}) {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <TitleText style={styles.titleText} height={160}>
        Rate your strength & conditioning level
      </TitleText>

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

      <StandardText style={styles.descriptionText} textColor="#C9B259" center>
        {activeOption.description}
      </StandardText>

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
    gap: 0,
  },
  titleText: {
    color: "#ffffff",
    marginBottom: 84,
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
    backgroundColor: "#C9B259",
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
    marginTop: 5,
    fontSize: 17,
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
