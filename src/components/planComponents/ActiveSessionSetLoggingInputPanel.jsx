import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DefaultSetLoggingInputPanel from "./DefaultSetLoggingInputPanel.jsx";
import WeightScroller from "../questionnaireComponents/weightBar.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
import RepCountSelector from "./RepCountSelector.jsx";
import TimeDurationSelector from "./TimeDurationSelector.jsx";

const RPE_OPTIONS = Object.freeze([
  5,
  5.5,
  6,
  6.5,
  7,
  7.5,
  8,
  8.5,
  9,
  9.5,
  10,
]);

function LoadScrollerField({
  field,
  recommendedLoadKg,
  exerciseIndex,
  setIndex,
  compact = false,
  onChange,
}) {
  const currentLoad = Number.parseFloat(field.value);
  const recommendedLoad = Number.parseFloat(recommendedLoadKg);
  const initialLoad = Number.isFinite(currentLoad)
    ? currentLoad
    : Number.isFinite(recommendedLoad)
      ? recommendedLoad
      : 0;
  return (
    <WeightScroller
      min={0}
      max={300}
      step={0.5}
      initialValue={initialLoad}
      unit="kg"
      height={compact ? 82 : 100}
      valueRowStyle={[
        styles.weightValuePill,
        compact ? styles.compactWeightValuePill : null,
      ]}
      valueTextStyle={[
        styles.weightValueText,
        compact ? styles.compactWeightValueText : null,
      ]}
      unitTextStyle={[
        styles.weightUnitText,
        compact ? styles.compactWeightUnitText : null,
      ]}
      rulerHeight={compact ? 42 : 52.5}
      indicatorLabel=""
      compact
      rulerStyle={styles.weightScroller}
      scrollContainerStyle={styles.weightScaleClip}
      indicatorStyle={styles.weightIndicator}
      edgeFade
      editableValue
      emitInitialValue={false}
      animateValueChanges
      valueChangeKey={`${exerciseIndex}:${setIndex}`}
      onChange={(value) => onChange(String(value))}
    />
  );
}

function RpeOption({ rpe, isSelected, compact = false, onPress }) {
  const selectionProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const displayValue = rpe.toFixed(1);

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
      hitSlop={{ top: 4, bottom: 4 }}
      style={[styles.rpeButton, compact ? styles.compactRpeButton : null]}
      onPress={onPress}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.rpeSelectionFill,
          {
            opacity: selectionProgress,
            transform: [
              {
                scaleX: selectionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
              {
                scaleY: selectionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
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
            compact ? styles.compactRpeButtonText : null,
            isSelected ? styles.rpeButtonTextSelected : null,
          ]}
        >
          {displayValue}
        </IBMPlexText>
      </Animated.View>
    </TouchableOpacity>
  );
}

function RpePillSelector({ value, compact = false, onChange }) {
  const selectedRpe = Number.parseFloat(value);

  return (
    <View
      accessibilityRole="radiogroup"
      style={[styles.rpePill, compact ? styles.compactRpePill : null]}
    >
      {RPE_OPTIONS.map((rpe) => {
        const isSelected = selectedRpe === rpe;

        return (
          <RpeOption
            key={rpe}
            rpe={rpe}
            isSelected={isSelected}
            compact={compact}
            onPress={() => onChange(isSelected ? "" : String(rpe))}
          />
        );
      })}
    </View>
  );
}

export default function ActiveSessionSetLoggingInputPanel(props) {
  const compact = Boolean(props.compact);

  return (
    <DefaultSetLoggingInputPanel
      {...props}
      fieldOrder={["loadKg", "rpe", "reps", "durationMinutes"]}
      rowStyle={[styles.inputRow, compact ? styles.compactInputRow : null]}
      anchorStyle={[
        styles.inputPanelAnchor,
        compact ? styles.compactInputPanelAnchor : null,
      ]}
      panelStyle={[styles.inputPanel, compact ? styles.compactInputPanel : null]}
      inputStyle={compact ? styles.compactInput : null}
      labelStyle={[styles.inputLabel, compact ? styles.compactInputLabel : null]}
      contentHorizontalInset={compact ? 6 : 8}
      expansionHorizontalOffset={compact ? 8 : 12}
      showFieldSeparators
      formatLabel={(label, field) =>
        field.id === "loadKg" ? label.replace(/\s*\(kg\)\s*/gi, "").trim() : label
      }
      renderField={({ field, onChange }) => {
        if (field.id === "rpe") {
          return (
            <RpePillSelector
              value={field.value}
              compact={compact}
              onChange={onChange}
            />
          );
        }

        if (field.id === "reps") {
          return (
            <RepCountSelector
              value={field.value}
              valueChangeKey={`${props.exerciseIndex}:${props.setIndex}`}
              onChange={onChange}
            />
          );
        }

        if (field.id === "durationMinutes") {
          return (
            <TimeDurationSelector
              value={field.value}
              onChange={onChange}
            />
          );
        }

        if (field.id !== "loadKg") {
          return undefined;
        }

        return (
          <LoadScrollerField
            field={field}
            recommendedLoadKg={props.recommendedLoadKg}
            exerciseIndex={props.exerciseIndex}
            setIndex={props.setIndex}
            compact={compact}
            onChange={onChange}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  inputPanelAnchor: {
    marginTop: 12,
    marginHorizontal: -12,
  },
  compactInputPanelAnchor: {
    marginHorizontal: -8,
    marginTop: 6,
  },
  inputPanel: {
    borderRadius: 20,
  },
  compactInputPanel: {
    borderRadius: 16,
  },
  inputRow: {
    gap: 40,
  },
  compactInputRow: {
    gap: 26,
  },
  inputLabel: {
    fontSize: 13,
    lineHeight: 17,
  },
  compactInputLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  compactInput: {
    minHeight: 36,
    fontSize: 14,
  },
  rpePill: {
    flexDirection: "row",
    gap: 4,
    minHeight: 48,
    overflow: "visible",
    width: "100%",
  },
  compactRpePill: {
    minHeight: 38,
  },
  rpeButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  compactRpeButton: {
    minHeight: 38,
  },
  rpeSelectionFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    borderColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
  },
  rpeButtonText: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 15,
  },
  compactRpeButtonText: {
    fontSize: 10,
    lineHeight: 13,
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
  compactWeightValuePill: {
    minHeight: 32,
    paddingHorizontal: 10,
  },
  weightValueText: {
    fontSize: 16,
    lineHeight: 20,
  },
  compactWeightValueText: {
    fontSize: 14,
    lineHeight: 17,
  },
  weightUnitText: {
    fontSize: 9,
    lineHeight: 11,
    bottom: 0,
  },
  compactWeightUnitText: {
    fontSize: 8,
    lineHeight: 10,
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
