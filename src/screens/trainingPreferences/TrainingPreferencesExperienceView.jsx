import {
  STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS,
} from "../../constants/trainingPreferences.js";
import TrainingPreferencePickerQuestionView from "./TrainingPreferencePickerQuestionView.jsx";

export default function TrainingPreferencesExperienceView({
  value,
  onChange,
}) {
  return (
    <TrainingPreferencePickerQuestionView
      label="How would you rate your strength and conditioning?"
      options={STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
