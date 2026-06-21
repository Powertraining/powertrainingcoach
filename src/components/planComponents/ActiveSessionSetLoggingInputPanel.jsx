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
      edgeFade
      editableValue
      emitInitialValue={false}
      animateValueChanges
      valueChangeKey={`${exerciseIndex}:${setIndex}`}
      onChange={(value) => onChange(String(value))}
    />
  );
}

function RpeOption({ rpe, isSelected, onPress }) {
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
      style={styles.rpeButton}
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
            isSelected ? styles.rpeButtonTextSelected : null,
          ]}
        >
          {displayValue}
        </IBMPlexText>
      </Animated.View>
    </TouchableOpacity>
  );
}

function RpePillSelector({ value, onChange }) {
  const selectedRpe = Number.parseFloat(value);

  return (
    <View
      accessibilityRole="radiogroup"
      style={styles.rpePill}
    >
      {RPE_OPTIONS.map((rpe) => {
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
      contentHorizontalInset={8}
      expansionHorizontalOffset={12}
      showFieldSeparators
      formatLabel={(label, field) =>
        field.id === "loadKg" ? label.replace(/\s*\(kg\)\s*/gi, "").trim() : label
      }
      renderField={({ field, onChange }) => {
        if (field.id === "rpe") {
          return <RpePillSelector value={field.value} onChange={onChange} />;
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

        if (field.id !== "loadKg") {
          return undefined;
        }

        return (
          <LoadScrollerField
            field={field}
            recommendedLoadKg={props.recommendedLoadKg}
            exerciseIndex={props.exerciseIndex}
            setIndex={props.setIndex}
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
    flexDirection: "row",
    gap: 4,
    minHeight: 48,
    overflow: "visible",
    width: "100%",
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
