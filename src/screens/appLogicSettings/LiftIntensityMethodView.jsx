import { LIFT_INTENSITY_METHOD_OPTIONS } from "../../constants/appLogicSettings.js";
import AppLogicPickerQuestionView from "./AppLogicPickerQuestionView.jsx";

export default function LiftIntensityMethodView({
  value,
  onChange,
}) {
  return (
    <AppLogicPickerQuestionView
      title="Lift intensity logic"
      options={LIFT_INTENSITY_METHOD_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
