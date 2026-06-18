import { StyleSheet } from "react-native";
import SetLoggingInputPanel from "./SetLoggingInputPanel.jsx";

export default function DefaultSetLoggingInputPanel({
  panelStyle,
  inputStyle,
  labelStyle,
  ...props
}) {
  return (
    <SetLoggingInputPanel
      {...props}
      panelStyle={[styles.panel, panelStyle]}
      inputStyle={[styles.input, inputStyle]}
      labelStyle={[styles.label, labelStyle]}
    />
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#0F0F0F",
    borderColor: "#1E1E1E",
    borderWidth: 2,
  },
  input: {
    borderRadius: 999,
    textAlign: "center",
    textAlignVertical: "center",
  },
  label: {
    textAlign: "center",
  },
});
