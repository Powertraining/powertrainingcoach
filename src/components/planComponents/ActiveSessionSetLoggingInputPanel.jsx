import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from "react-native";
import DefaultSetLoggingInputPanel from "./DefaultSetLoggingInputPanel.jsx";
import WeightScroller from "../questionnaireComponents/weightBar.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
import RepCountSelector from "./RepCountSelector.jsx";

function RpeOption({ rpe, isSelected, onPress }) {
  const selectionProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const isFirst = rpe === 1;
  const isLast = rpe === 10;
  const isEdge = isFirst || isLast;

  useEffect(() => {
    const animation = Animated.timing(selectionProgress, {
      toValue: isSelected ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [isSelected, selectionProgress]);

  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityLabel={`RPE ${rpe}`}
      accessibilityState={{ selected: isSelected }}
      activeOpacity={0.75}
      hitSlop={{
        top: 4,
        bottom: 4,
        left: isFirst ? 10 : 0,
        right: isLast ? 10 : 0,
      }}
      style={[
        styles.rpeButton,
        rpe > 1 ? styles.rpeButtonDivider : null,
        isEdge ? styles.rpeButtonEdge : null,
      ]}
      onPress={onPress}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.rpeSelectionFill,
          isFirst ? styles.rpeSelectionFillFirst : null,
          isLast ? styles.rpeSelectionFillLast : null,
          {
            opacity: selectionProgress,
            transform: [
              {
                scaleX: selectionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.72, 1],
                }),
              },
              {
                scaleY: selectionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.82, 1],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={{
          zIndex: 1,
          transform: [
            {
              scale: selectionProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.08],
              }),
            },
          ],
        }}
      >
        <IBMPlexText
          style={[
            styles.rpeButtonText,
            isSelected ? styles.rpeButtonTextSelected : null,
          ]}
        >
          {rpe}
        </IBMPlexText>
      </Animated.View>
    </TouchableOpacity>
  );
}

function RpePillSelector({ value, onChange }) {
  const selectedRpe = Number.parseInt(value, 10);

  return (
    <View
      accessibilityRole="radiogroup"
      style={styles.rpePill}
    >
      {Array.from({ length: 10 }, (_, index) => index + 1).map((rpe) => {
        const isSelected = selectedRpe === rpe;

        return (
          <RpeOption
            key={rpe}
            rpe={rpe}
            isSelected={isSelected}
            onPress={() => onChange(isSelected ? "" : String(rpe))}
          />
        );
      })}
    </View>
  );
}

export default function ActiveSessionSetLoggingInputPanel(props) {
  return (
    <DefaultSetLoggingInputPanel
      {...props}
      fieldOrder={["loadKg", "rpe", "reps"]}
      rowStyle={styles.inputRow}
      anchorStyle={styles.inputPanelAnchor}
      panelStyle={styles.inputPanel}
      labelStyle={styles.inputLabel}
      showFieldSeparators
      formatLabel={(label, field) =>
        field.id === "loadKg" ? label.replace(/\s*\(kg\)\s*/gi, "").trim() : label
      }
      renderField={({ field, onChange }) => {
        if (field.id === "rpe") {
          return <RpePillSelector value={field.value} onChange={onChange} />;
        }

        if (field.id === "reps") {
          return <RepCountSelector value={field.value} onChange={onChange} />;
        }

        if (field.id !== "loadKg") {
          return undefined;
        }

        const currentLoad = Number.parseFloat(field.value);
        const recommendedLoad = Number.parseFloat(props.recommendedLoadKg);

        return (
          <WeightScroller
            key={`${props.exerciseIndex}-${props.setIndex}`}
            min={0}
            max={300}
            step={1}
            initialValue={
              Number.isFinite(currentLoad)
                ? currentLoad
                : Number.isFinite(recommendedLoad)
                  ? recommendedLoad
                  : 0
            }
            unit="kg"
            height={100}
            valueRowStyle={styles.weightValuePill}
            valueTextStyle={styles.weightValueText}
            unitTextStyle={styles.weightUnitText}
            rulerHeight={52.5}
            indicatorLabel=""
            compact
            rulerStyle={styles.weightScroller}
            scrollContainerStyle={styles.weightScaleClip}
            indicatorStyle={styles.weightIndicator}
            onChange={(value) => onChange(String(value))}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  inputPanelAnchor: {
    marginTop: 12,
  },
  inputPanel: {
    borderRadius: 20,
  },
  inputRow: {
    gap: 40,
  },
  inputLabel: {
    fontSize: 13,
    lineHeight: 17,
  },
  rpePill: {
    minHeight: 55,
    flexDirection: "row",
    overflow: "visible",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#000",
  },
  rpeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  rpeButtonEdge: {
    zIndex: 2,
  },
  rpeButtonDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#2A2A2A",
  },
  rpeSelectionFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
  },
  rpeSelectionFillFirst: {
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  rpeSelectionFillLast: {
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  rpeButtonText: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 15,
  },
  rpeButtonTextSelected: {
    color: "#000",
    fontWeight: "700",
  },
  weightValuePill: {
    alignSelf: "center",
    minHeight: 38,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#000",
  },
  weightValueText: {
    fontSize: 16,
    lineHeight: 20,
  },
  weightUnitText: {
    fontSize: 9,
    lineHeight: 11,
    bottom: 0,
  },
  weightScroller: {
    overflow: "visible",
  },
  weightScaleClip: {
    height: "100%",
    overflow: "hidden",
    borderRadius: 999,
  },
  weightIndicator: {
    top: "-10%",
    bottom: "auto",
    height: "120%",
    marginTop: 0,
    zIndex: 2,
  },
});
