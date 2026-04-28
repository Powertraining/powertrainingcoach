import TrainingPreferenceTextareaQuestionView from "./TrainingPreferenceTextareaQuestionView.jsx";

export default function TrainingPreferencesInjuriesView({
  value,
  onChange,
}) {
  return (
    <TrainingPreferenceTextareaQuestionView
      label="Injuries / weaknesses"
      placeholder="e.g. sore shoulder, weak left kick, knee rehab"
      value={value}
      onChange={onChange}
    />
  );
}
