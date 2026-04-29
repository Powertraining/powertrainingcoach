import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";

import { DELOAD_STRATEGY_OPTIONS } from "../../constants/appLogicSettings.js";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const DELOAD_OPTION_TEXT = Object.freeze({
  maintain_intensity_reduce_volume: {
    mediaText: "Maintain intensity",
    description: "Reduce volume 30-50%",
    afterReps: "5reps",
    afterWeight: "10kg",
  },
  maintain_volume_reduce_intensity: {
    mediaText: "Maintain volume",
    description: "Reduce intensity",
    afterReps: "10reps",
    afterWeight: "5kg",
  },
});

function ExampleArrow({ color }) {
  return (
    <View style={styles.exampleArrow}>
      <View style={[styles.exampleArrowTail, { backgroundColor: color }]} />
      <View style={[styles.exampleArrowHead, { borderLeftColor: color }]} />
    </View>
  );
}

export default function DeloadStrategyView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <TitleText height={130}>Deload strategy</TitleText>
      <View style={styles.contentSlot}>
        {DELOAD_STRATEGY_OPTIONS.map((option) => {
          const content = DELOAD_OPTION_TEXT[option.value];
          const isSelected = value === option.value;
          const textColor = "#ffffff";
          const repsTextColor =
            option.value === "maintain_intensity_reduce_volume"
              ? "#C9B259"
              : textColor;
          const weightTextColor =
            option.value === "maintain_volume_reduce_intensity"
              ? "#C9B259"
              : textColor;

          return (
            <View
              key={option.value}
              style={[
                styles.optionButton,
                isSelected ? styles.optionButtonSelected : null,
              ]}
            >
              <StandardText
                style={styles.optionMediaText}
                textColor={textColor}
                center
              >
                {content?.mediaText ?? option.label}
              </StandardText>
              <StandardText
                fontSize={14}
                style={styles.optionLabel}
                textColor={textColor}
                center
              >
                {content?.description ?? option.description}
              </StandardText>
              <View style={styles.example}>
                <View style={[styles.exampleBlock, styles.exampleBlockLeft]}>
                  <StandardText fontSize={14} textColor={repsTextColor} style={styles.exampleTextLeft}>
                    10reps
                  </StandardText>
                  <StandardText fontSize={14} textColor={weightTextColor} style={styles.exampleTextLeft}>
                    10kg
                  </StandardText>
                </View>
                <ExampleArrow color={textColor} />
                <View style={[styles.exampleBlock, styles.exampleBlockRight]}>
                  <StandardText fontSize={14} textColor={repsTextColor} style={styles.exampleTextRight}>
                    {content?.afterReps ?? "5reps"}
                  </StandardText>
                  <StandardText fontSize={14} textColor={weightTextColor} style={styles.exampleTextRight}>
                    {content?.afterWeight ?? "10kg"}
                  </StandardText>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  isSelected ? styles.selectButtonSelected : null,
                ]}
                onPress={() => onChange?.(option.value)}
              >
                <StandardText
                  fontSize={16}
                  textColor={isSelected ? "#ffffff" : "#000000"}
                  center
                >
                  {isSelected ? "Selected" : "Select"}
                </StandardText>
              </TouchableOpacity>
            </View>
          );
        })}
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
    gap: 18,
    height: 470,
    justifyContent: "center",
  },
  optionButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 220,
    justifyContent: "center",
    position: "relative",
    width: "75%",
  },
  optionButtonSelected: {
    borderColor: "#ffffff",
    borderStyle: "solid",
    borderWidth: 2,
  },
  optionMediaText: {
    fontSize: 26,
    marginBottom: 0,
    paddingHorizontal: 18,
    position: "absolute",
    top: 22,
    width: "100%",
  },
  optionLabel: {
    paddingHorizontal: 18,
    position: "absolute",
    top: 64,
    width: "100%",
  },
  example: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
    position: "absolute",
    top: 112,
    width: "100%",
  },
  exampleArrow: {
    alignItems: "center",
    flexDirection: "row",
    width: 34,
  },
  exampleArrowTail: {
    height: 3,
    width: 24,
  },
  exampleArrowHead: {
    borderBottomColor: "transparent",
    borderBottomWidth: 6,
    borderLeftWidth: 9,
    borderTopColor: "transparent",
    borderTopWidth: 6,
    height: 0,
    width: 0,
  },
  exampleBlock: {
    width: 44,
  },
  exampleBlockLeft: {
    alignItems: "flex-start",
  },
  exampleBlockRight: {
    alignItems: "flex-end",
  },
  exampleTextLeft: {
    textAlign: "left",
    width: "100%",
  },
  exampleTextRight: {
    textAlign: "right",
    width: "100%",
  },
  selectButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 120,
    bottom: 14,
    height: 34,
    justifyContent: "center",
    position: "absolute",
    width: 104,
  },
  selectButtonSelected: {
    backgroundColor: "#000000",
  },
});
