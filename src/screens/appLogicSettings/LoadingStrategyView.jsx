import { LOADING_STRATEGY_OPTIONS } from "../../constants/appLogicSettings.js";
import AppLogicPickerQuestionView from "./AppLogicPickerQuestionView.jsx";

export default function LoadingStrategyView({
  value,
  onChange,
}) {
  return (
    <AppLogicPickerQuestionView
      title="Loading strategy"
      options={LOADING_STRATEGY_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
