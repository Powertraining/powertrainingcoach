import { useState } from "react";
import {
  LIFT_INTENSITY_METHOD_OPTIONS,
  PERCENTAGE_REFERENCE_METHOD_OPTIONS,
} from "../../constants/appLogicSettings.js";
import { Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const ARROW_ICON = require("../../assets/icons/arrow.png");

const LIFT_INTENSITY_MEDIA_TEXT = Object.freeze({
  rpe: "RPE",
});

const LIFT_INTENSITY_DESCRIPTION_TEXT = Object.freeze({
  rpe: "Autoregulate by feel",
});

const PERCENTAGE_REFERENCE_BUTTONS = Object.freeze({
  true_1rm: {
    description: "Test true max strength",
    mediaText: "1RM",
  },
  multi_rm: {
    description: "Estimate from hard reps",
    mediaText: "2-5RM",
  },
  heavy_single: {
    description: "Low-fatigue strength check",
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
            label={LIFT_INTENSITY_DESCRIPTION_TEXT[rpeOption.value]}
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
          <Image
            source={ARROW_ICON}
            style={[
              styles.advancedArrow,
              isAdvancedExpanded ? styles.advancedArrowExpanded : null,
            ]}
            resizeMode="contain"
          />
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
                  label={buttonContent?.description ?? option.description}
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
    height: 16,
    tintColor: "#ffffff",
    transform: [{ rotate: "90deg" }],
    width: 16,
  },
  advancedArrowExpanded: {
    transform: [{ rotate: "-90deg" }],
  },
  referenceOptions: {
    gap: 16,
  },
});
