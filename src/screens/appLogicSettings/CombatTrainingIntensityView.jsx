import { COMBAT_TRAINING_INTENSITY_OPTIONS } from "../../constants/appLogicSettings.js";
import AppLogicPickerQuestionView from "./AppLogicPickerQuestionView.jsx";

export default function CombatTrainingIntensityView({
  value,
  onChange,
}) {
  return (
    <AppLogicPickerQuestionView
      title="How intense is current combat sports training?"
      options={COMBAT_TRAINING_INTENSITY_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
