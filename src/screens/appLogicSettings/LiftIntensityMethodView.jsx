import { useState } from "react";
import {
  LIFT_INTENSITY_METHOD_OPTIONS,
  PERCENTAGE_REFERENCE_METHOD_OPTIONS,
} from "../../constants/appLogicSettings.js";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const LIFT_INTENSITY_MEDIA_TEXT = Object.freeze({
  rpe: "RPE",
});

const PERCENTAGE_REFERENCE_BUTTONS = Object.freeze({
  true_1rm: {
    label: "Use tested max",
    mediaText: "1RM",
  },
  multi_rm: {
    label: "Estimate from 2-5 reps",
    mediaText: "2-5RM",
  },
});

const PERCENTAGE_REFERENCE_DISPLAY_ORDER = Object.freeze([
  "multi_rm",
  "true_1rm",
]);

const TITLE_BLOCK_HEIGHT = 196;
const SECTION_TOP_PADDING = 52;
const OPTIONS_BOTTOM_CLEARANCE = 132;

export default function LiftIntensityMethodView({
  value,
  onChange,
  percentageReferenceValue,
  onPercentageReferenceChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const rpeOption = LIFT_INTENSITY_METHOD_OPTIONS.find(
    (option) => option.value === "rpe"
  );

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <TitleText height={TITLE_BLOCK_HEIGHT}>Lift intensity method</TitleText>
      <ScrollView
        style={styles.optionsScroll}
        contentContainerStyle={styles.contentSlot}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {rpeOption ? (
          <PreferenceOptionButton
            isSelected={value === rpeOption.value}
            label="Adjust by effort"
            mediaText={LIFT_INTENSITY_MEDIA_TEXT[rpeOption.value]}
            buttonStyle={styles.optionButton}
            selectedButtonStyle={styles.optionButtonSelected}
            labelStyle={styles.optionLabel}
            mediaTextStyle={styles.optionMediaText}
            badge="Recommended"
            onPress={() =>
              onChange?.(value === rpeOption.value ? null : rpeOption.value)
            }
          />
        ) : null}
        <TouchableOpacity
          style={styles.advancedRow}
          onPress={() => setIsAdvancedExpanded((current) => !current)}
        >
          <StandardText style={styles.advancedText}>Advanced</StandardText>
          <Text
            style={[
              styles.advancedArrow,
              isAdvancedExpanded ? styles.advancedArrowExpanded : null,
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>
        {isAdvancedExpanded ? (
          <View style={styles.referenceOptions}>
            {PERCENTAGE_REFERENCE_DISPLAY_ORDER.map((optionValue) => {
              const option = PERCENTAGE_REFERENCE_METHOD_OPTIONS.find(
                (referenceOption) => referenceOption.value === optionValue
              );
              if (!option) {
                return null;
              }

              const buttonContent = PERCENTAGE_REFERENCE_BUTTONS[option.value];

              return (
                <PreferenceOptionButton
                  key={option.value}
                  isSelected={
                    value === "percentage" &&
                    percentageReferenceValue === option.value
                  }
                  label={buttonContent?.label ?? option.label}
                  mediaText={buttonContent?.mediaText}
                  buttonStyle={styles.optionButton}
                  selectedButtonStyle={styles.optionButtonSelected}
                  labelStyle={styles.optionLabel}
                  mediaTextStyle={styles.optionMediaText}
                  onPress={() => onPercentageReferenceChange?.(option.value)}
                />
              );
            })}
          </View>
        ) : null}
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
  optionButton: {
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 2,
    height: 112,
  },
  optionButtonSelected: {
    backgroundColor: "#181818",
    borderColor: "#ffffff",
  },
  optionLabel: {
    bottom: "auto",
    color: "#A6A6A6",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
    position: "relative",
    textTransform: "uppercase",
  },
  optionMediaText: {
    fontSize: 26,
    marginBottom: 8,
  },
  advancedRow: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  advancedText: {
    color: "#8E8E8E",
    fontSize: 16,
  },
  advancedArrow: {
    color: "#8E8E8E",
    fontSize: 24,
    lineHeight: 24,
    transform: [{ rotate: "90deg" }],
  },
  advancedArrowExpanded: {
    transform: [{ rotate: "-90deg" }],
  },
  referenceOptions: {
    gap: 16,
  },
});
