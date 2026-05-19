import { SESSION_DURATION_OPTIONS } from "../../constants/trainingPreferences.js";
import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import SessionDurationSelector from "../../components/questionnaireComponents/SessionDurationSelector.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const SELECTOR_HEIGHT = 70 * 3;
const CONTINUE_BUTTON_TOP_OFFSET = 80;

export default function TrainingPreferencesSessionDurationView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [helperBottom, setHelperBottom] = useState(null);
  const continueButtonTop = screenHeight - CONTINUE_BUTTON_TOP_OFFSET;
  const selectorTop =
    typeof helperBottom === "number"
      ? helperBottom + (continueButtonTop - helperBottom - SELECTOR_HEIGHT) / 2
      : null;

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <TitleText height={130}>Duration of each session</TitleText>
      <StandardText
        style={styles.helperText}
        center
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setHelperBottom(y + height);
        }}
      >
        Pick how much time you can usually commit so each workout fits your schedule.
      </StandardText>
      <View
        style={[
          styles.selectorWrap,
          selectorTop === null ? styles.selectorWrapPending : { top: selectorTop },
        ]}
      >
        <SessionDurationSelector
          options={SESSION_DURATION_OPTIONS}
          value={value}
          onChange={onChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-start",
    paddingTop: 180,
    position: "relative",
  },
  helperText: {
    width: "82%",
    alignSelf: "center",
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  selectorWrap: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  selectorWrapPending: {
    opacity: 0,
  },
});
