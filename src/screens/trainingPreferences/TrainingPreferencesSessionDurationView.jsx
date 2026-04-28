import { SESSION_DURATION_OPTIONS } from "../../constants/trainingPreferences.js";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import SessionDurationSelector from "../../components/questionnaireComponents/SessionDurationSelector.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

export default function TrainingPreferencesSessionDurationView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <TitleText height={130}>Duration of each session</TitleText>
      <SessionDurationSelector
        options={SESSION_DURATION_OPTIONS}
        value={value}
        onChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
});
