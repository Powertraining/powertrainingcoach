import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";
import DefaultSetLoggingInputPanel from "./DefaultSetLoggingInputPanel.jsx";
import WeightScroller from "../questionnaireComponents/weightBar.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
import RepCountSelector from "./RepCountSelector.jsx";
import TimeDurationSelector from "./TimeDurationSelector.jsx";
import { fonts } from "../../theme/colors.js";

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
const FIELD_VISUALS = Object.freeze({
  loadKg: { accent: "#3B82F6", icon: "barbell-outline" },
  reps: { accent: "#22C55E", icon: "stats-chart-outline" },
  durationMinutes: { accent: "#0A84FF", icon: "timer-outline" },
  rpe: { accent: "#F59E0B", icon: "speedometer-outline" },
});

function getFieldSupportText(field, props) {
  if (
    field.id === "loadKg" &&
    props.recommendedLoadKg !== "" &&
    props.recommendedLoadKg != null &&
    Number.isFinite(Number(props.recommendedLoadKg))
  ) {
    return `Suggested: ${props.recommendedLoadKg} kg`;
  }

  if (
    field.id === "reps" &&
    props.recommendedRepCount !== "" &&
    props.recommendedRepCount != null &&
    Number.isFinite(Number(props.recommendedRepCount))
  ) {
    return `Target: ${props.recommendedRepCount}`;
  }

  if (
    field.id === "durationMinutes" &&
    props.targetDurationMinutes !== "" &&
    props.targetDurationMinutes != null &&
    Number.isFinite(Number(props.targetDurationMinutes))
  ) {
    return `Target: ${props.targetDurationMinutes} min`;
  }

  if (field.id === "rpe" && props.targetRpe) {
    return `Target: RPE ${props.targetRpe}`;
  }

  return field.isCustom ? field.placeholder : "Log what you completed";
}

function LoadScrollerField({
  field,
  recommendedLoadKg,
  exerciseIndex,
  setIndex,
  compact = false,
  onInputFocus,
  onInputBlur,
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
      height={78}
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
      rulerHeight={78}
      indicatorLabel=""
      compact
      showTickLabels={false}
      rulerStyle={styles.weightScroller}
      scrollContainerStyle={styles.weightScaleClip}
      indicatorStyle={styles.weightIndicator}
      edgeFade
      editableValue
      valueInIndicator
      emitInitialValue={false}
      animateValueChanges
      valueChangeKey={`${exerciseIndex}:${setIndex}`}
      onValueFocus={onInputFocus}
      onValueBlur={onInputBlur}
      onChange={(value) => onChange(String(value))}
    />
  );
}

function RpePillSelector({ value, onInputFocus, onInputBlur, onChange }) {
  const selectedRpe = Number.parseFloat(value);
  const selectedIndex = Number.isFinite(selectedRpe)
    ? RPE_OPTIONS.reduce(
        (closestIndex, option, optionIndex) =>
          Math.abs(option - selectedRpe) <
          Math.abs(RPE_OPTIONS[closestIndex] - selectedRpe)
            ? optionIndex
            : closestIndex,
        0
      )
    : 0;
  const scrollRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isEditingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(selectedIndex);
  const [inputValue, setInputValue] = useState(
    RPE_OPTIONS[selectedIndex].toFixed(1)
  );
  const itemWidth = 64;
  const itemHeight = 52;
  const sidePadding = Math.max((containerWidth - itemWidth) / 2, 0);

  function getIndexFromOffset(offsetX) {
    return Math.min(
      RPE_OPTIONS.length - 1,
      Math.max(0, Math.round(offsetX / itemWidth))
    );
  }

  function finalizeSelection(offsetX) {
    const nextIndex = getIndexFromOffset(offsetX);

    setDisplayedIndex(nextIndex);
    setInputValue(RPE_OPTIONS[nextIndex].toFixed(1));
    scrollRef.current?.scrollTo({
      x: nextIndex * itemWidth,
      animated: true,
    });
    onChange?.(String(RPE_OPTIONS[nextIndex]));
    isInteractingRef.current = false;
  }

  function commitTypedValue() {
    const parsedValue = Number.parseFloat(inputValue.replace(",", "."));
    const fallbackValue = RPE_OPTIONS[displayedIndex];
    const nextValue = Math.min(
      10,
      Math.max(
        5,
        Math.round((Number.isFinite(parsedValue) ? parsedValue : fallbackValue) * 2) /
          2
      )
    );
    const nextIndex = RPE_OPTIONS.indexOf(nextValue);

    isEditingRef.current = false;
    isInteractingRef.current = false;
    setDisplayedIndex(nextIndex);
    setInputValue(nextValue.toFixed(1));
    scrollRef.current?.scrollTo({
      x: nextIndex * itemWidth,
      animated: true,
    });
    onChange?.(String(nextValue));
    onInputBlur?.();
  }

  useEffect(() => {
    if (!containerWidth || isInteractingRef.current) {
      return;
    }

    setDisplayedIndex(selectedIndex);
    setInputValue(RPE_OPTIONS[selectedIndex].toFixed(1));
    scrollRef.current?.scrollTo({
      x: selectedIndex * itemWidth,
      animated: false,
    });
  }, [containerWidth, itemWidth, selectedIndex]);

  return (
    <View
      style={[styles.rpePillViewport, { height: itemHeight }]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        accessibilityRole="radiogroup"
        horizontal
        bounces={false}
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        scrollEventThrottle={16}
        style={styles.rpePill}
        contentContainerStyle={[
          styles.rpePillContent,
          { paddingHorizontal: sidePadding },
        ]}
        onScroll={(event) => {
          const nextIndex = getIndexFromOffset(
            event.nativeEvent.contentOffset.x
          );
          setDisplayedIndex(nextIndex);
          if (!isEditingRef.current) {
            setInputValue(RPE_OPTIONS[nextIndex].toFixed(1));
          }
        }}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onMomentumScrollEnd={(event) =>
          finalizeSelection(event.nativeEvent.contentOffset.x)
        }
        onScrollEndDrag={(event) => {
          const velocityX = Math.abs(event.nativeEvent.velocity?.x || 0);

          if (velocityX <= 0.05) {
            finalizeSelection(event.nativeEvent.contentOffset.x);
          }
        }}
      >
        {RPE_OPTIONS.map((rpe, rpeIndex) => (
          <View
            key={rpe}
            style={[styles.rpeItem, { height: itemHeight, width: itemWidth }]}
          >
            <IBMPlexText
              style={[
                styles.rpeItemText,
                rpeIndex === displayedIndex
                  ? styles.rpeItemTextSelected
                  : null,
              ]}
            >
              {rpe.toFixed(1)}
            </IBMPlexText>
          </View>
        ))}
      </ScrollView>
      <TextInput
        accessibilityHint="Enter an RPE from 5 to 10 or swipe the scale"
        accessibilityLabel="RPE"
        cursorColor="#FFFFFF"
        keyboardType="decimal-pad"
        maxLength={4}
        selectTextOnFocus
        value={inputValue}
        onBlur={commitTypedValue}
        onChangeText={(nextValue) => {
          if (/^\d{0,2}(?:[.,]\d?)?$/.test(nextValue)) {
            setInputValue(nextValue);
          }
        }}
        onFocus={() => {
          isEditingRef.current = true;
          isInteractingRef.current = true;
          onInputFocus?.();
        }}
        onSubmitEditing={commitTypedValue}
        style={[
          styles.rpeSelectedFrame,
          styles.rpeEditableSelectedValue,
          { marginLeft: -itemWidth / 2, width: itemWidth },
        ]}
      />
      <Svg pointerEvents="none" style={[styles.rpeEdgeFade, styles.rpeEdgeFadeLeft]}>
        <Defs>
          <SvgLinearGradient id="rpe-fade-left" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#101010" stopOpacity="1" />
            <Stop offset="1" stopColor="#101010" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#rpe-fade-left)" />
      </Svg>
      <Svg pointerEvents="none" style={[styles.rpeEdgeFade, styles.rpeEdgeFadeRight]}>
        <Defs>
          <SvgLinearGradient id="rpe-fade-right" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#101010" stopOpacity="0" />
            <Stop offset="1" stopColor="#101010" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#rpe-fade-right)" />
      </Svg>
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
      fieldStyle={[styles.inputField, compact ? styles.compactInputField : null]}
      anchorStyle={[
        styles.inputPanelAnchor,
        compact ? styles.compactInputPanelAnchor : null,
      ]}
      panelStyle={[styles.inputPanel, compact ? styles.compactInputPanel : null]}
      inputStyle={[styles.rowInput, compact ? styles.compactInput : null]}
      labelStyle={[styles.inputLabel, compact ? styles.compactInputLabel : null]}
      contentHorizontalInset={compact ? 6 : 8}
      expansionHorizontalOffset={compact ? 8 : 12}
      renderLabel={({ field }) => {
        const visual = FIELD_VISUALS[field.id] || {
          accent: "#CDBB58",
          icon: "options-outline",
        };

        return (
          <View style={styles.fieldHeading}>
            <View
              style={[
                styles.fieldIcon,
                { borderColor: `${visual.accent}66` },
              ]}
            >
              <Ionicons color={visual.accent} name={visual.icon} size={19} />
            </View>
            <View style={styles.fieldHeadingCopy}>
              <IBMPlexText style={styles.fieldTitle}>
                {field.id === "loadKg"
                  ? "Load used"
                  : field.label}
              </IBMPlexText>
              <IBMPlexText style={styles.fieldSupport}>
                {getFieldSupportText(field, props)}
              </IBMPlexText>
            </View>
          </View>
        );
      }}
      formatLabel={(label, field) =>
        field.id === "loadKg" ? label.replace(/\s*\(kg\)\s*/gi, "").trim() : label
      }
      renderField={({ field, onChange, onFocus, onBlur }) => {
        if (field.id === "rpe") {
          return (
            <View style={styles.fieldControl}>
              <RpePillSelector
                value={field.value}
                onInputFocus={onFocus}
                onInputBlur={onBlur}
                onChange={onChange}
              />
            </View>
          );
        }

        if (field.id === "reps") {
          return (
            <View style={styles.fieldControl}>
              <RepCountSelector
                value={field.value}
                valueChangeKey={`${props.exerciseIndex}:${props.setIndex}`}
                compact
                editable
                onInputFocus={onFocus}
                onInputBlur={onBlur}
                onChange={onChange}
              />
            </View>
          );
        }

        if (field.id === "durationMinutes") {
          return (
            <View style={styles.fieldControl}>
              <TimeDurationSelector
                value={field.value}
                compact
                onChange={onChange}
              />
            </View>
          );
        }

        if (field.id !== "loadKg") {
          return undefined;
        }

        return (
          <View style={styles.fieldControl}>
            <LoadScrollerField
              field={field}
              recommendedLoadKg={props.recommendedLoadKg}
              exerciseIndex={props.exerciseIndex}
              setIndex={props.setIndex}
              compact={compact}
              onInputFocus={onFocus}
              onInputBlur={onBlur}
              onChange={onChange}
            />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  inputPanelAnchor: {
    marginTop: 12,
    marginHorizontal: 0,
  },
  compactInputPanelAnchor: {
    marginHorizontal: 0,
    marginTop: 6,
  },
  inputPanel: {
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    padding: 0,
  },
  compactInputPanel: {
    borderRadius: 16,
  },
  inputRow: {
    gap: 4,
  },
  compactInputRow: {
    gap: 2,
  },
  inputField: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 98,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  compactInputField: {
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 9,
  },
  fieldHeading: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 8,
    width: 108,
  },
  fieldIcon: {
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderRadius: 9,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  fieldHeadingCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  fieldTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
  },
  fieldSupport: {
    color: "#8B8B94",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  fieldControl: {
    flex: 1,
    height: 78,
    justifyContent: "center",
    marginLeft: -6,
    marginRight: 6,
    minWidth: 0,
  },
  rowInput: {
    flex: 1,
    marginLeft: -6,
    marginRight: 6,
    minWidth: 0,
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
  rpePillViewport: {
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  rpePill: {
    flex: 1,
    width: "100%",
    zIndex: 1,
  },
  rpePillContent: {
    alignItems: "center",
    flexDirection: "row",
  },
  rpeItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  rpeItemText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 17,
    opacity: 0.45,
  },
  rpeItemTextSelected: {
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 20,
    opacity: 1,
  },
  rpeSelectedFrame: {
    backgroundColor: "#000000",
    borderColor: "#34343A",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    left: "50%",
    position: "absolute",
    top: 8,
    zIndex: 0,
  },
  rpeEditableSelectedValue: {
    color: "#FFFFFF",
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 20,
    padding: 0,
    textAlign: "center",
    textAlignVertical: "center",
    zIndex: 4,
  },
  rpeEdgeFade: {
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 24,
    zIndex: 3,
  },
  rpeEdgeFadeLeft: {
    left: 0,
  },
  rpeEdgeFadeRight: {
    right: 0,
  },
  weightValuePill: {
    alignSelf: "center",
    height: 36,
    minWidth: 64,
    minHeight: 36,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#34343A",
    backgroundColor: "#000",
  },
  compactWeightValuePill: {
    minHeight: 36,
    paddingHorizontal: 8,
  },
  weightValueText: {
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 20,
  },
  compactWeightValueText: {
    fontSize: 17,
    lineHeight: 20,
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
    alignItems: "center",
    backgroundColor: "#000000",
    borderColor: "#34343A",
    borderRadius: 999,
    borderWidth: 1,
    bottom: "auto",
    height: 64,
    justifyContent: "center",
    marginLeft: -18,
    marginTop: 0,
    overflow: "hidden",
    top: 7,
    width: 36,
    zIndex: 3,
  },
});
