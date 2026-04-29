import { PERCENTAGE_REFERENCE_METHOD_OPTIONS } from "../../constants/appLogicSettings.js";
import AppLogicPickerQuestionView from "./AppLogicPickerQuestionView.jsx";

export default function PercentageReferenceMethodView({
  value,
  onChange,
}) {
  return (
    <AppLogicPickerQuestionView
      title="How should the app gauge strength for % work?"
      helperText="Choose how main lifts get their % references. The app will schedule these conservatively and store the results for future plan updates."
      options={PERCENTAGE_REFERENCE_METHOD_OPTIONS}
      value={value}
      onChange={onChange}
      footerText="Heavy singles are the default and can appear about every 3rd loading week. 2-5RM tests are occasional, and true 1RMs are rare plus limited to suitable off-camp phases."
    />
  );
}
