import TrainingPreferenceTextareaQuestionView from "./TrainingPreferenceTextareaQuestionView.jsx";

export default function TrainingPreferencesEventPreparationView({
  value,
  onChange,
}) {
  return (
    <TrainingPreferenceTextareaQuestionView
      label="Which competition(s) or important events are you preparing for?"
      helperText="Include anything useful, such as event names, dates, or rough timelines."
      placeholder="e.g. amateur bout on 2026-06-20, regional tournament in September"
      value={value}
      onChange={onChange}
    />
  );
}
