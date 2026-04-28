import { SESSION_DURATION_OPTIONS } from "../../constants/trainingPreferences.js";
import TrainingPreferencePickerQuestionView from "./TrainingPreferencePickerQuestionView.jsx";

export default function TrainingPreferencesSessionDurationView({
  value,
  onChange,
}) {
  return (
    <TrainingPreferencePickerQuestionView
      label="Duration of each session"
      options={SESSION_DURATION_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
