import { useState } from "react";
import {
  LIFT_INTENSITY_METHOD_OPTIONS,
  PERCENTAGE_REFERENCE_METHOD_OPTIONS,
} from "../../constants/appLogicSettings.js";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const LIFT_INTENSITY_MEDIA_TEXT = Object.freeze({
  rpe: "RPE",
});

const PERCENTAGE_REFERENCE_BUTTONS = Object.freeze({
  true_1rm: {
    label: "True 1RM tests",
    mediaText: "1RM",
  },
  multi_rm: {
    label: "2-5RM + Epley",
    mediaText: "2-5RM",
  },
  heavy_single: {
    label: "Heavy single",
    mediaText: "RPE 8-9",
  },
});

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
      <TitleText height={130}>Lift intensity logic</TitleText>
      <View style={styles.contentSlot}>
        {rpeOption ? (
          <PreferenceOptionButton
            isSelected={value === rpeOption.value}
            label={rpeOption.label}
            mediaText={LIFT_INTENSITY_MEDIA_TEXT[rpeOption.value]}
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
            {PERCENTAGE_REFERENCE_METHOD_OPTIONS.map((option) => {
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
                  onPress={() => onPercentageReferenceChange?.(option.value)}
                />
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
    paddingBottom: 120,
  },
  contentSlot: {
    gap: 16,
    height: 300,
    justifyContent: "flex-start",
  },
  advancedRow: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  advancedText: {
    color: "#ffffff",
    fontSize: 16,
  },
  advancedArrow: {
    color: "#ffffff",
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
