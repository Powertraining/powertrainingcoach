import { EQUIPMENT_OPTIONS } from "../../constants/trainingPreferences.js";
import TrainingPreferencePickerQuestionView from "./TrainingPreferencePickerQuestionView.jsx";

export default function TrainingPreferencesEquipmentView({
  value,
  onChange,
}) {
  return (
    <TrainingPreferencePickerQuestionView
      label="Equipment available"
      options={EQUIPMENT_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
