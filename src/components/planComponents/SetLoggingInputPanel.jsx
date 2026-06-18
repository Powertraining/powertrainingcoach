import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const NEXT_INPUT_KEYBOARD_GAP = 36;
const INPUT_PANEL_ANIMATION_DURATION = 90;
const INPUT_FOCUS_SHIFT_DELAY_MS = 30;
const KEYBOARD_SHOW_SHIFT_DELAY_MS = 40;
const SESSION_HORIZONTAL_PADDING = 24;

export default function SetLoggingInputPanel({
  exerciseIndex,
  setIndex,
  draft,
  showLoad,
  showReps,
  showRpe,
  strengthAssessment,
  strengthRequirements,
  customFields = [],
  onDraftChange,
  panelStyle,
  inputStyle,
  labelStyle,
  renderField,
  fieldOrder,
  rowStyle,
  showFieldSeparators = false,
  formatLabel,
  anchorStyle,
}) {
  const focusedScrollTargetKeyRef = useRef(null);
  const inputFieldLayoutsRef = useRef({});
  const inputPanelLayoutRef = useRef(null);
  const inputPanelAnchorRef = useRef(null);
  const inputPanelExpansion = useRef(new Animated.Value(0)).current;
  const inputPanelTranslateY = useRef(new Animated.Value(0)).current;
  const inputRowYRef = useRef(0);
  const keyboardTopRef = useRef(null);
  const defaultInputKeys = [
    showLoad ? "loadKg" : null,
    showReps ? "reps" : null,
    showRpe ? "rpe" : null,
    ...customFields.map((field) => field.id),
  ].filter(Boolean);
  const inputKeys = Array.isArray(fieldOrder)
    ? [
        ...fieldOrder.filter((fieldId) => defaultInputKeys.includes(fieldId)),
        ...defaultInputKeys.filter((fieldId) => !fieldOrder.includes(fieldId)),
      ]
    : defaultInputKeys;

  function animateInputPanelShift(nextShift) {
    Animated.timing(inputPanelTranslateY, {
      duration: INPUT_PANEL_ANIMATION_DURATION,
      toValue: -nextShift,
      useNativeDriver: false,
    }).start();
  }

  function animateInputPanelExpansion(nextValue) {
    Animated.timing(inputPanelExpansion, {
      duration: INPUT_PANEL_ANIMATION_DURATION,
      toValue: nextValue,
      useNativeDriver: false,
    }).start();
  }

  function resetInputPanel() {
    TextInput.State?.currentlyFocusedInput?.()?.blur?.();
    keyboardTopRef.current = null;
    focusedScrollTargetKeyRef.current = null;
    animateInputPanelExpansion(0);
    animateInputPanelShift(0);
  }

  function updateInputPanelShift() {
    const keyboardTop = keyboardTopRef.current;
    const targetKey = focusedScrollTargetKeyRef.current;
    const targetLayout = targetKey ? inputFieldLayoutsRef.current[targetKey] : null;
    const inputPanelLayout = inputPanelLayoutRef.current;
    const inputPanelAnchor = inputPanelAnchorRef.current;

    if (
      keyboardTop == null ||
      !targetLayout ||
      !inputPanelLayout ||
      !inputPanelAnchor?.measureInWindow
    ) {
      return;
    }

    inputPanelAnchor.measureInWindow((x, y) => {
      const inputPanelBottom = y + inputPanelLayout.height;
      const targetBottomInPanel = inputRowYRef.current + targetLayout.y + targetLayout.height;
      const distanceFromPanelBottomToTargetBottom =
        inputPanelLayout.height - targetBottomInPanel;
      const nextShift = Math.max(
        inputPanelBottom +
          NEXT_INPUT_KEYBOARD_GAP -
          keyboardTop -
          distanceFromPanelBottomToTargetBottom,
        0
      );

      animateInputPanelShift(nextShift);
    });
  }

  function handleInputFocus(inputKey) {
    const inputIndex = inputKeys.indexOf(inputKey);
    focusedScrollTargetKeyRef.current = inputKeys[inputIndex + 1] || inputKey;
    animateInputPanelExpansion(1);
    setTimeout(updateInputPanelShift, INPUT_FOCUS_SHIFT_DELAY_MS);
  }

  function handleInputBlur() {
    setTimeout(() => {
      if (!TextInput.State?.currentlyFocusedInput?.()) {
        resetInputPanel();
      }
    }, 0);
  }

  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const showSubscription = Keyboard.addListener(keyboardShowEvent, (event) => {
      keyboardTopRef.current =
        event.endCoordinates?.screenY ??
        (event.endCoordinates?.height
          ? Dimensions.get("window").height - event.endCoordinates.height
          : null);
      setTimeout(updateInputPanelShift, KEYBOARD_SHOW_SHIFT_DELAY_MS);
    });
    const hideSubscriptions = [Keyboard.addListener("keyboardDidHide", resetInputPanel)];

    if (Platform.OS === "ios") {
      hideSubscriptions.push(Keyboard.addListener("keyboardWillHide", resetInputPanel));
    }

    return () => {
      showSubscription.remove();
      hideSubscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  const inputPanelAnimatedStyle = {
    borderBottomLeftRadius: inputPanelExpansion.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 0],
    }),
    borderBottomRightRadius: inputPanelExpansion.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 0],
    }),
    marginHorizontal: inputPanelExpansion.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -SESSION_HORIZONTAL_PADDING],
    }),
    paddingHorizontal: inputPanelExpansion.interpolate({
      inputRange: [0, 1],
      outputRange: [14, SESSION_HORIZONTAL_PADDING + 14],
    }),
  };
  const edgeToEdgeRowStyle = showFieldSeparators
    ? {
        marginHorizontal: inputPanelExpansion.interpolate({
          inputRange: [0, 1],
          outputRange: [-14, -(SESSION_HORIZONTAL_PADDING + 14)],
        }),
      }
    : null;
  const paddedFieldStyle = showFieldSeparators
    ? {
        paddingHorizontal: inputPanelExpansion.interpolate({
          inputRange: [0, 1],
          outputRange: [14, SESSION_HORIZONTAL_PADDING + 14],
        }),
      }
    : null;

  const fields = [
    showLoad && {
      id: "loadKg",
      label: strengthRequirements?.loadLabel || "Load used (kg)",
      value: draft.loadKg,
      keyboardType: "decimal-pad",
      placeholder: "e.g. 150",
    },
    showReps && {
      id: "reps",
      label: strengthRequirements?.repsLabel || "Reps completed",
      value: draft.reps,
      keyboardType: "number-pad",
      placeholder:
        strengthRequirements?.repsPlaceholder || (strengthAssessment ? "2-5" : "e.g. 8"),
    },
    showRpe && {
      id: "rpe",
      label: strengthRequirements?.rpeLabel || "RPE",
      value: draft.rpe,
      keyboardType: "decimal-pad",
      placeholder: strengthRequirements?.rpePlaceholder || "8-9",
    },
    ...customFields.map((field) => ({
      ...field,
      value: draft.customValues?.[field.id] || "",
      placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
      isCustom: true,
    })),
  ]
    .filter(Boolean)
    .sort((left, right) => inputKeys.indexOf(left.id) - inputKeys.indexOf(right.id));

  return (
    <View
      ref={inputPanelAnchorRef}
      collapsable={false}
      style={[styles.inputPanelAnchor, anchorStyle]}
    >
      <Animated.View
        style={[
          styles.inputPanel,
          inputPanelAnimatedStyle,
          { transform: [{ translateY: inputPanelTranslateY }] },
          panelStyle,
        ]}
        onLayout={(event) => {
          inputPanelLayoutRef.current = event.nativeEvent.layout;
        }}
      >
        <Animated.View
          style={[styles.inputRow, edgeToEdgeRowStyle, rowStyle]}
          onLayout={(event) => {
            inputRowYRef.current = event.nativeEvent.layout.y;
          }}
        >
          {fields.map((field, fieldIndex) => (
            <Animated.View
              key={field.id}
              style={[styles.inputField, paddedFieldStyle]}
              onLayout={(event) => {
                inputFieldLayoutsRef.current[field.id] = event.nativeEvent.layout;
              }}
            >
              <IBMPlexText style={[styles.inputLabel, labelStyle]}>
                {formatLabel?.(field.label, field) ?? field.label}
              </IBMPlexText>
              {renderField?.({
                field,
                onChange: (value) =>
                  onDraftChange(exerciseIndex, setIndex, field.id, value, field.isCustom),
              }) ?? (
                <TextInput
                  value={field.value}
                  onChangeText={(value) =>
                    onDraftChange(exerciseIndex, setIndex, field.id, value, field.isCustom)
                  }
                  onBlur={handleInputBlur}
                  onFocus={() => handleInputFocus(field.id)}
                  keyboardType={field.keyboardType}
                  placeholder={field.placeholder}
                  placeholderTextColor="#A1A1AA"
                  style={[styles.input, inputStyle]}
                />
              )}
              {showFieldSeparators && fieldIndex < fields.length - 1 ? (
                <View pointerEvents="none" style={styles.inputFieldSeparator} />
              ) : null}
            </Animated.View>
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputPanelAnchor: { marginTop: 30 },
  inputPanel: {
    gap: 10,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#101010",
  },
  inputRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  inputField: {
    position: "relative",
    flexBasis: "100%",
    flexGrow: 1,
    minWidth: 140,
    gap: 5,
  },
  inputFieldSeparator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -21,
    height: 2,
    backgroundColor: "#1E1E1E",
  },
  inputLabel: { color: "#D4D4D8", fontSize: 12, fontWeight: "700" },
  input: {
    minHeight: 42,
    borderRadius: 6,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#fff",
  },
});
