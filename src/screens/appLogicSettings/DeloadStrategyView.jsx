import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { DELOAD_STRATEGY_OPTIONS } from "../../constants/appLogicSettings.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const DELOAD_OPTION_TEXT = Object.freeze({
  maintain_intensity_reduce_volume: {
    mediaText: "Keep load heavy",
    description: "Do fewer total reps",
    afterReps: "5r",
    afterWeight: "10kg",
  },
  maintain_volume_reduce_intensity: {
    mediaText: "Keep reps similar",
    description: "Use lighter weight",
    afterReps: "10r",
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

export default function DeloadStrategyView({ value, onChange }) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <IBMPlexText titleBlock height={230}>Deload strategy</IBMPlexText>
      <ScrollView
        style={styles.optionsScroll}
        contentContainerStyle={styles.contentSlot}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
            <TouchableOpacity
              accessibilityLabel={`${isSelected ? "Selected" : "Select"} ${option.label}`}
              accessibilityRole="button"
              key={option.value}
              onPress={() => onChange?.(isSelected ? null : option.value)}
              style={[
                styles.optionButton,
                isSelected ? styles.optionButtonSelected : null,
              ]}
            >
              <IBMPlexText defaultWhite
                lines={1}
                style={styles.optionMediaText}
                textColor={textColor}
                center
              >
                {content?.mediaText ?? option.label}
              </IBMPlexText>
              <IBMPlexText defaultWhite
                fontSize={13}
                lines={2}
                style={styles.optionLabel}
                textColor={isSelected ? "#ffffff" : "#A6A6A6"}
                center
              >
                {content?.description ?? option.description}
              </IBMPlexText>

              <View style={styles.example}>
                <View style={[styles.exampleBlock, styles.exampleBlockLeft]}>
                  <IBMPlexText defaultWhite
                    fontSize={14}
                    textColor={repsTextColor}
                    style={[
                      styles.exampleTextLeft,
                      option.value === "maintain_intensity_reduce_volume"
                        ? styles.exampleTextChanged
                        : null,
                    ]}
                  >
                    10r
                  </IBMPlexText>
                  <IBMPlexText defaultWhite
                    fontSize={14}
                    textColor={weightTextColor}
                    style={[
                      styles.exampleTextLeft,
                      option.value === "maintain_volume_reduce_intensity"
                        ? styles.exampleTextChanged
                        : null,
                    ]}
                  >
                    10kg
                  </IBMPlexText>
                </View>
                <ExampleArrow color={textColor} />
                <View style={[styles.exampleBlock, styles.exampleBlockRight]}>
                  <IBMPlexText defaultWhite
                    fontSize={14}
                    textColor={repsTextColor}
                    style={[
                      styles.exampleTextRight,
                      option.value === "maintain_intensity_reduce_volume"
                        ? styles.exampleTextChanged
                        : null,
                    ]}
                  >
                    {content?.afterReps ?? "5reps"}
                  </IBMPlexText>
                  <IBMPlexText defaultWhite
                    fontSize={14}
                    textColor={weightTextColor}
                    style={[
                      styles.exampleTextRight,
                      option.value === "maintain_volume_reduce_intensity"
                        ? styles.exampleTextChanged
                        : null,
                    ]}
                  >
                    {content?.afterWeight ?? "10kg"}
                  </IBMPlexText>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "flex-start",
    paddingTop: 78,
  },
  optionsScroll: {
    alignSelf: "stretch",
    flex: 1,
  },
  contentSlot: {
    gap: 14,
    justifyContent: "flex-start",
    paddingBottom: 140,
  },
  optionButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 2,
    height: 190,
    justifyContent: "center",
    position: "relative",
    width: "75%",
  },
  optionButtonSelected: {
    backgroundColor: "#181818",
    borderColor: "#ffffff",
  },
  optionMediaText: {
    fontSize: 24,
    marginBottom: 0,
    paddingHorizontal: 18,
    position: "absolute",
    top: 22,
    width: "100%",
  },
  optionLabel: {
    paddingHorizontal: 18,
    position: "absolute",
    top: 68,
    width: "100%",
  },
  example: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
    position: "absolute",
    top: 124,
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
    gap: 4,
    width: 46,
  },
  exampleBlockLeft: {
    alignItems: "flex-start",
  },
  exampleBlockRight: {
    alignItems: "flex-end",
  },
  exampleTextLeft: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    color: "#000000",
    lineHeight: 17,
    overflow: "hidden",
    textAlign: "center",
    width: "100%",
  },
  exampleTextRight: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    color: "#000000",
    lineHeight: 17,
    overflow: "hidden",
    textAlign: "center",
    width: "100%",
  },
  exampleTextChanged: {
    backgroundColor: "#C9B259",
  },
});
