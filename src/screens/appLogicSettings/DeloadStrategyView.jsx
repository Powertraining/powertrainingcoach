import { DELOAD_STRATEGY_OPTIONS } from "../../constants/appLogicSettings.js";
import AppLogicPickerQuestionView from "./AppLogicPickerQuestionView.jsx";

export default function DeloadStrategyView({
  value,
  onChange,
}) {
  return (
    <AppLogicPickerQuestionView
      title="Deload strategy"
      options={DELOAD_STRATEGY_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
