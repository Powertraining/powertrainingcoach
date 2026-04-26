import { DESIRED_TRAINING_OPTIONS } from "../../constants/trainingPreferences.js";
import TrainingPreferencePickerQuestionView from "./TrainingPreferencePickerQuestionView.jsx";

export default function TrainingPreferencesDesiredTrainingView({
  value,
  onChange,
}) {
  return (
    <TrainingPreferencePickerQuestionView
      label="Desired training"
      options={DESIRED_TRAINING_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
